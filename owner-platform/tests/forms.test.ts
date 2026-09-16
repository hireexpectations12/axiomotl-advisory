import { describe, expect, it } from "vitest";
import {
  evaluateForm,
  pruneAnswers,
  validateForm,
  canChangeQuestionType,
  SKIPPED_ANSWER,
} from "../src/lib/forms";
import type { FormDefinition } from "../src/lib/types";
import baseline from "../src/generated/baseline.json";

function fixture(): FormDefinition {
  return {
    id: "f",
    name: "Journey",
    startQuestionId: "a",
    email: "hello@example.com",
    emailSubject: "My summary",
    fallbackOutcomeId: "default",
    questions: [
      {
        id: "a",
        title: "Challenge",
        choices: [
          { id: "yes", label: "Yes" },
          { id: "skip", label: "Skip", next: { kind: "question", id: "c" } },
        ],
        next: { kind: "question", id: "b" },
      },
      {
        id: "b",
        title: "Context",
        choices: [{ id: "deep", label: "Deep" }],
        next: { kind: "question", id: "c" },
      },
      {
        id: "c",
        title: "Style",
        choices: [
          { id: "embedded", label: "Embedded" },
          { id: "other", label: "Other" },
        ],
      },
    ],
    outcomes: ["default", "special"].map((id) => ({
      id,
      title: id,
      body: "Result",
      outputs: [],
      ctaLabel: "Contact",
      ctaUrl: "/contact",
    })),
    rules: [
      {
        id: "embedded",
        label: "Embedded override",
        fromQuestionId: "c",
        match: "any",
        conditions: [{ questionId: "c", answerId: "embedded" }],
        target: { kind: "outcome", id: "special" },
      },
      {
        id: "context",
        label: "Context route",
        fromQuestionId: "c",
        match: "all",
        conditions: [
          { questionId: "a", answerId: "yes" },
          { questionId: "b", answerId: "deep" },
        ],
        target: { kind: "outcome", id: "default" },
      },
    ],
  };
}
describe("form routing", () => {
  it("retains free text fields in brief builders", () => {
    const f = fixture();
    f.questions[0].kind = "text";
    f.questions[0].choices = [];
    expect(evaluateForm(f, { a: "Our desired outcome" }).questionId).toBe("b");
    expect(pruneAnswers(f, { a: "Our desired outcome" })).toEqual({
      a: "Our desired outcome",
    });
    expect(validateForm(f).errors).toEqual([]);
  });
  it("waits for each question and follows explicit choice branches", () => {
    expect(evaluateForm(fixture(), {})).toEqual({
      questionId: "a",
      path: ["a"],
    });
    expect(evaluateForm(fixture(), { a: "skip" })).toMatchObject({
      questionId: "c",
      path: ["a", "c"],
    });
  });
  it("uses the first matching source rule and fallback", () => {
    expect(
      evaluateForm(fixture(), { a: "yes", b: "deep", c: "embedded" }),
    ).toMatchObject({ outcomeId: "special", ruleId: "embedded" });
    expect(
      evaluateForm(fixture(), { a: "yes", b: "deep", c: "other" }),
    ).toMatchObject({ outcomeId: "default", ruleId: "context" });
    expect(evaluateForm(fixture(), { a: "skip", c: "other" })).toMatchObject({
      outcomeId: "default",
      path: ["a", "c"],
    });
  });
  it("does not let stale or future answers satisfy conditions", () => {
    const f = fixture();
    f.rules[1].conditions = [{ questionId: "b", answerId: "deep" }];
    expect(
      evaluateForm(f, { a: "skip", b: "deep", c: "other" }).ruleId,
    ).toBeUndefined();
    expect(pruneAnswers(f, { a: "skip", b: "deep", c: "other" })).toEqual({
      a: "skip",
      c: "other",
    });
    expect(evaluateForm(f, { a: "yes", c: "embedded" }).questionId).toBe("b");
  });
  it("keeps ID mappings stable after reordering and renaming", () => {
    const f = fixture();
    f.questions.reverse();
    f.questions[2].choices.reverse();
    f.questions[2].choices[0].label = "Renamed";
    expect(evaluateForm(f, { a: "skip", c: "embedded" }).outcomeId).toBe(
      "special",
    );
  });
  it("gives answer overrides priority over rules and ignores invalid answers", () => {
    const f = fixture();
    f.questions[2].choices[0].next = { kind: "outcome", id: "default" };
    expect(evaluateForm(f, { a: "skip", c: "embedded" })).toMatchObject({
      outcomeId: "default",
      path: ["a", "c"],
    });
    expect(evaluateForm(f, { a: "not-an-answer", c: "embedded" })).toEqual({
      questionId: "a",
      path: ["a"],
    });
  });
  it("bounds runtime traversal even when invalid data bypasses validation", () => {
    const f = fixture();
    f.questions[2].next = { kind: "question", id: "a" };
    expect(() => evaluateForm(f, { a: "skip", c: "other" })).toThrow(/cycle/);
  });
});
describe("form validation", () => {
  it("ignores defaults overridden by every choice and hidden choice edges on text questions", () => {
    const f = fixture();
    f.rules = [];
    f.questions = [
      {
        id: "a",
        title: "A",
        choices: [
          { id: "yes", label: "Yes", next: { kind: "outcome", id: "default" } },
        ],
        next: { kind: "question", id: "a" },
      },
    ];
    expect(validateForm(f).errors).toEqual([]);
    f.questions[0].kind = "text";
    f.questions[0].choices[0].next = { kind: "question", id: "a" };
    f.questions[0].next = { kind: "outcome", id: "default" };
    expect(validateForm(f).errors).toEqual([]);
  });
  it("blocks answer-type changes while conditions refer to the question", () => {
    const f = fixture();
    expect(canChangeQuestionType(f, "a")).toBe(false);
    f.rules = [];
    expect(canChangeQuestionType(f, "a")).toBe(true);
  });
  it("supports skipping optional choice and text questions without accepting skip on required questions", () => {
    const f = fixture();
    f.questions[0].required = false;
    expect(evaluateForm(f, { a: SKIPPED_ANSWER }).questionId).toBe("b");
    expect(pruneAnswers(f, { a: SKIPPED_ANSWER })).toEqual({
      a: SKIPPED_ANSWER,
    });
    f.questions[0].kind = "text";
    expect(evaluateForm(f, { a: SKIPPED_ANSWER }).questionId).toBe("b");
    f.questions[0].required = true;
    expect(evaluateForm(f, { a: SKIPPED_ANSWER }).questionId).toBe("a");
    f.questions[0].kind = "choice";
    f.questions[0].choices[0].id = SKIPPED_ANSWER;
    expect(validateForm(f).errors.join(" ")).toMatch(/reserved/i);
  });
  it("retains each matched route while awaiting another answer and at the final outcome", () => {
    const f = fixture();
    f.rules.unshift({
      id: "first",
      label: "First",
      fromQuestionId: "a",
      match: "all",
      conditions: [{ questionId: "a", answerId: "yes" }],
      target: { kind: "question", id: "b" },
    });
    expect(evaluateForm(f, { a: "yes" })).toMatchObject({
      questionId: "b",
      ruleId: "first",
      trace: [
        {
          questionId: "a",
          answerId: "yes",
          ruleId: "first",
          target: { kind: "question", id: "b" },
        },
      ],
    });
    const result = evaluateForm(f, { a: "yes", b: "deep", c: "embedded" });
    expect(result.trace?.map((step) => step.ruleId).filter(Boolean)).toEqual([
      "first",
      "embedded",
    ]);
  });
  it("accepts a complete form", () =>
    expect(validateForm(fixture()).errors).toEqual([]));
  it("rejects missing references and duplicated IDs", () => {
    const f = fixture();
    f.questions[0].choices.push({ ...f.questions[0].choices[0] });
    f.rules[0].target.id = "missing";
    expect(validateForm(f).errors.join(" ")).toMatch(/duplicate/i);
    expect(validateForm(f).errors.join(" ")).toMatch(/missing/i);
  });
  it("rejects reachable cycles and invalid CTA destinations", () => {
    const f = fixture();
    f.questions[2].next = { kind: "question", id: "a" };
    f.outcomes[0].ctaUrl = "javascript:alert(1)";
    expect(validateForm(f).errors.join(" ")).toMatch(/cycle/i);
    expect(validateForm(f).errors.join(" ")).toMatch(/destination/i);
  });
  it("reports unreachable nodes and shadowed rules", () => {
    const f = fixture();
    f.questions.push({
      id: "unused",
      title: "Unused",
      choices: [{ id: "ok", label: "Ok" }],
    });
    f.rules.push({ ...f.rules[0], id: "shadow" });
    expect(validateForm(f).warnings.join(" ")).toMatch(/unreachable/i);
    expect(validateForm(f).warnings.join(" ")).toMatch(/shadow/i);
  });
});

describe("imported production forms", () => {
  const journey = baseline.forms.find(
    (f) => f.id === "journey",
  ) as FormDefinition;
  it.each(["diagnostic", "decisions", "transition", "embedded"])(
    "preserves all context and working-style paths for %s",
    (challenge) => {
      const context = journey.questions.find(
        (q) => q.id === `context-${challenge}`,
      )!;
      const style = journey.questions.find((q) => q.id === "working-style")!;
      for (const answer of context.choices)
        for (const working of style.choices) {
          const result = evaluateForm(journey, {
            challenge,
            [context.id]: answer.id,
            "working-style": working.id,
          });
          expect(result.outcomeId).toBe(
            working.id === "embedded" ? "embedded" : challenge,
          );
          expect(result.path).toEqual([
            "challenge",
            context.id,
            "working-style",
          ]);
        }
    },
  );
  it("validates both imported forms and preserves free-text brief answers", () => {
    for (const form of baseline.forms)
      expect(validateForm(form as FormDefinition).errors).toEqual([]);
    const decision = baseline.forms.find(
      (f) => f.id === "decision",
    ) as FormDefinition;
    const answers = Object.fromEntries(
      decision.questions.map((q) => [
        q.id,
        q.kind === "text" ? `My ${q.id}` : q.choices[0].id,
      ]),
    );
    expect(evaluateForm(decision, answers).outcomeId).toBe("brief");
    expect(pruneAnswers(decision, answers)).toEqual(answers);
  });
});
