import type { Answers, FormDefinition, FormEvaluation, Target } from "./types";

export const SKIPPED_ANSWER = "__skip__";
export function canChangeQuestionType(
  form: FormDefinition,
  questionId: string,
): boolean {
  return !form.rules.some((rule) =>
    rule.conditions.some((condition) => condition.questionId === questionId),
  );
}

export function evaluateForm(
  form: FormDefinition,
  answers: Answers,
): FormEvaluation {
  const path: string[] = [];
  const visited: Answers = {};
  const trace: NonNullable<FormEvaluation["trace"]> = [];
  let target: Target = { kind: "question", id: form.startQuestionId };
  let ruleId: string | undefined;
  while (target.kind === "question") {
    if (path.includes(target.id) || path.length >= 100)
      throw new Error("Form contains a cycle or exceeds 100 questions.");
    const question = form.questions.find((q) => q.id === target.id);
    if (!question) throw new Error(`Missing question: ${target.id}`);
    path.push(question.id);
    const value = answers[question.id];
    const choice =
      value === SKIPPED_ANSWER
        ? question.required === false
          ? { id: SKIPPED_ANSWER, next: undefined }
          : undefined
        : question.kind === "text"
          ? value?.trim()
            ? { id: value, next: undefined }
            : undefined
          : question.choices.find((c) => c.id === value);
    if (!choice)
      return {
        questionId: question.id,
        path,
        ...(ruleId ? { ruleId } : {}),
        ...(trace.length ? { trace } : {}),
      };
    visited[question.id] = choice.id;
    const rule = form.rules.find(
      (r) =>
        r.fromQuestionId === question.id &&
        r.conditions.length > 0 &&
        (r.match === "all"
          ? r.conditions.every((c) => visited[c.questionId] === c.answerId)
          : r.conditions.some((c) => visited[c.questionId] === c.answerId)),
    );
    const matchedRuleId = choice.next ? undefined : rule?.id;
    if (matchedRuleId) ruleId = matchedRuleId;
    target = choice.next ??
      rule?.target ??
      question.next ?? { kind: "outcome", id: form.fallbackOutcomeId };
    trace.push({
      questionId: question.id,
      answerId: choice.id,
      ...(matchedRuleId ? { ruleId: matchedRuleId } : {}),
      target,
    });
  }
  if (!form.outcomes.some((o) => o.id === target.id))
    throw new Error(`Missing outcome: ${target.id}`);
  return {
    outcomeId: target.id,
    ...(ruleId ? { ruleId } : {}),
    path,
    ...(trace.length ? { trace } : {}),
  };
}

export function pruneAnswers(form: FormDefinition, answers: Answers): Answers {
  const evaluation = evaluateForm(form, answers);
  return Object.fromEntries(
    evaluation.path
      .filter((id) =>
        form.questions.some(
          (q) =>
            q.id === id &&
            (answers[id] === SKIPPED_ANSWER
              ? q.required === false
              : q.kind === "text"
                ? Boolean(answers[id]?.trim())
                : q.choices.some((c) => c.id === answers[id])),
        ),
      )
      .map((id) => [id, answers[id]]),
  );
}

export function safeDestination(url: string): boolean {
  return (
    !/[\u0000-\u0020\\]/.test(url) &&
    (/^\/(?!\/)/.test(url) ||
      /^#[\w-]+$/.test(url) ||
      /^https?:\/\//i.test(url) ||
      /^mailto:[^?\s@]+@[^?\s@]+(?:\?.*)?$/i.test(url))
  );
}

export function validateForm(form: FormDefinition): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const duplicate = (ids: string[], label: string) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (!id.trim()) errors.push(`${label}: empty ID.`);
      if (seen.has(id)) errors.push(`${label}: duplicate ID ${id}.`);
      seen.add(id);
    }
  };
  duplicate([form.id], "Form");
  duplicate(
    form.questions.map((q) => q.id),
    "Questions",
  );
  duplicate(
    form.outcomes.map((o) => o.id),
    "Outcomes",
  );
  duplicate(
    form.rules.map((r) => r.id),
    "Rules",
  );
  if (
    form.questions.length > 100 ||
    form.rules.length > 500 ||
    form.outcomes.length > 100
  )
    errors.push(
      "Form exceeds supported limits (100 questions, 100 outcomes, 500 rules).",
    );
  const targetValid = (target: Target, label: string) => {
    if (
      !target ||
      !["question", "outcome"].includes(target.kind) ||
      !(target.kind === "question" ? form.questions : form.outcomes).some(
        (x) => x.id === target.id,
      )
    )
      errors.push(
        `${label}: missing ${target?.kind ?? "target"} ${target?.id ?? ""}.`,
      );
  };
  targetValid({ kind: "question", id: form.startQuestionId }, "Start");
  targetValid({ kind: "outcome", id: form.fallbackOutcomeId }, "Fallback");
  if (form.email && !/^[^\s@?]+@[^\s@?]+\.[^\s@?]+$/.test(form.email))
    errors.push("Summary email is invalid.");
  for (const q of form.questions) {
    duplicate(
      q.choices.map((c) => c.id),
      `Question ${q.id} answers`,
    );
    if (q.choices.some((c) => c.id === SKIPPED_ANSWER))
      errors.push(
        `Question ${q.id}: answer ID ${SKIPPED_ANSWER} is reserved for skipping optional questions.`,
      );
    if (!q.title.trim() || (q.kind !== "text" && !q.choices.length))
      errors.push(`Question ${q.id} needs a title and at least one answer.`);
    if (q.choices.length > 100)
      errors.push(`Question ${q.id} exceeds 100 answers.`);
    if (q.next) targetValid(q.next, `Question ${q.id}`);
    for (const c of q.choices) {
      if (!c.label.trim()) errors.push(`Answer ${q.id}/${c.id} needs a label.`);
      if (c.next) targetValid(c.next, `Answer ${q.id}/${c.id}`);
    }
  }
  for (const o of form.outcomes) {
    if (!o.title.trim()) errors.push(`Outcome ${o.id} needs a title.`);
    if (o.ctaUrl && !safeDestination(o.ctaUrl))
      errors.push(`Outcome ${o.id}: invalid CTA destination.`);
  }
  for (const [index, r] of form.rules.entries()) {
    targetValid(
      { kind: "question", id: r.fromQuestionId },
      `Rule ${r.id} source`,
    );
    targetValid(r.target, `Rule ${r.id}`);
    if (
      !r.conditions.length ||
      r.conditions.length > 100 ||
      !["all", "any"].includes(r.match)
    )
      errors.push(`Rule ${r.id} needs 1–100 conditions and all/any matching.`);
    for (const c of r.conditions)
      if (
        c.answerId === SKIPPED_ANSWER ||
        !form.questions.some(
          (q) =>
            q.id === c.questionId &&
            (q.kind === "text"
              ? Boolean(c.answerId.trim())
              : q.choices.some((a) => a.id === c.answerId)),
        )
      )
        errors.push(
          `Rule ${r.id}: missing or reserved answer ${c.questionId}/${c.answerId}.`,
        );
    const keys = new Set(
      r.conditions.map((c) => `${c.questionId}:${c.answerId}`),
    );
    if (
      form.rules
        .slice(0, index)
        .some(
          (prev) =>
            prev.fromQuestionId === r.fromQuestionId &&
            prev.match === r.match &&
            prev.conditions.length === keys.size &&
            prev.conditions.every((c) =>
              keys.has(`${c.questionId}:${c.answerId}`),
            ),
        )
    )
      warnings.push(
        `Rule ${r.id} is shadowed by an earlier identical condition.`,
      );
    else if (
      form.rules
        .slice(0, index)
        .some(
          (prev) =>
            prev.fromQuestionId === r.fromQuestionId &&
            prev.conditions.some((c) =>
              keys.has(`${c.questionId}:${c.answerId}`),
            ),
        )
    )
      warnings.push(
        `Rule ${r.id} may overlap an earlier rule; first match wins.`,
      );
  }
  // Conservatively inspect every configured edge, including conditional branches.
  const reached = new Set<string>();
  const active = new Set<string>();
  const outcomes = new Set<string>();
  const walk = (id: string) => {
    if (active.has(id)) {
      errors.push(`Reachable cycle at question ${id}.`);
      return;
    }
    if (reached.has(id) || reached.size > 100) return;
    const q = form.questions.find((q) => q.id === id);
    if (!q) return;
    reached.add(id);
    active.add(id);
    const usesDefault =
      q.kind === "text" ||
      q.required === false ||
      q.choices.some((c) => !c.next);
    const targets: Target[] = [
      ...(q.kind === "text"
        ? []
        : q.choices.flatMap((c) => (c.next ? [c.next] : []))),
      ...(usesDefault
        ? [
            ...form.rules
              .filter((r) => r.fromQuestionId === id)
              .map((r) => r.target),
            q.next ?? { kind: "outcome", id: form.fallbackOutcomeId },
          ]
        : []),
    ];
    for (const t of targets) {
      if (t.kind === "outcome") outcomes.add(t.id);
      else walk(t.id);
    }
    active.delete(id);
  };
  walk(form.startQuestionId);
  for (const q of form.questions)
    if (!reached.has(q.id)) warnings.push(`Question ${q.id} is unreachable.`);
  for (const o of form.outcomes)
    if (!outcomes.has(o.id)) warnings.push(`Outcome ${o.id} is unreachable.`);
  return { errors: [...new Set(errors)], warnings };
}
