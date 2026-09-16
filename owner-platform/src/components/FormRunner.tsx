"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  evaluateForm,
  pruneAnswers,
  safeDestination,
  validateForm,
  SKIPPED_ANSWER,
} from "../lib/forms";
import type { Answers, FormDefinition, FormEvaluation } from "../lib/types";

export function FormRunner({
  form,
  onTrace,
  initialAnswers = {},
}: {
  form: FormDefinition;
  onTrace?: (evaluation: FormEvaluation) => void;
  initialAnswers?: Answers;
}) {
  const [answers, setAnswers] = useState<Answers>(() => {
    try {
      return pruneAnswers(form, initialAnswers);
    } catch {
      return {};
    }
  });
  const [editing, setEditing] = useState<string>();
  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const lastScreen = useRef<string | undefined>(undefined);
  const validation = useMemo(() => validateForm(form), [form]);
  const evaluation = useMemo(() => {
    try {
      return evaluateForm(form, answers);
    } catch {
      return { path: [] } as FormEvaluation;
    }
  }, [form, answers]);
  useEffect(() => {
    onTrace?.(evaluation);
  }, [evaluation, onTrace]);
  const question = form.questions.find(
    (q) => q.id === (editing ?? evaluation.questionId),
  );
  const outcome = form.outcomes.find((o) => o.id === evaluation.outcomeId);
  const screen = question?.id ?? outcome?.id;
  useEffect(() => {
    if (lastScreen.current !== undefined && lastScreen.current !== screen)
      heading.current?.focus();
    lastScreen.current = screen;
    setError("");
  }, [screen]);
  const summary = [
    form.name,
    ...evaluation.path.flatMap((id) => {
      const q = form.questions.find((q) => q.id === id);
      const value = answers[id];
      return q && value
        ? [
            `${q.title}: ${value === SKIPPED_ANSWER ? "Skipped" : q.kind === "text" ? value : (q.choices.find((c) => c.id === value)?.label ?? value)}`,
          ]
        : [];
    }),
    ...(outcome ? [outcome.title, outcome.body, ...outcome.outputs] : []),
    ...(context.trim() ? ["Additional context: " + context.trim()] : []),
  ].join("\n\n");
  const answer = (value: string) => {
    if (!question) return;
    // Keep still-reachable context while removing answers from abandoned branches.
    const retained = answers;
    setAnswers(pruneAnswers(form, { ...retained, [question.id]: value }));
    setEditing(undefined);
    setText("");
  };
  const back = () => {
    const position = editing
      ? evaluation.path.indexOf(editing)
      : evaluation.questionId
        ? evaluation.path.length - 1
        : evaluation.path.length;
    const id = evaluation.path[position - 1];
    setEditing(id);
    setText(answers[id] === SKIPPED_ANSWER ? "" : (answers[id] ?? ""));
  };
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([summary], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.id}-summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  if (validation.errors.length)
    return (
      <section className="notice" role="status">
        <h3>Repair this form to preview it</h3>
        <ul>
          {validation.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </section>
    );
  return (
    <section className="form-runner stack" aria-label={form.name}>
      {question ? (
        <>
          <p className="muted">
            Question {evaluation.path.indexOf(question.id) + 1} · {form.name}
          </p>
          <h3 ref={heading} tabIndex={-1}>
            {question.title}
          </h3>
          {question.help && <p>{question.help}</p>}
          {question.kind === "text" ? (
            <form
              className="stack"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (text.trim() === SKIPPED_ANSWER)
                  setError(
                    "This answer is reserved. Enter a different answer.",
                  );
                else if (text.trim()) answer(text.trim());
                else if (question.required === false) answer(SKIPPED_ANSWER);
                else setError("Enter an answer to continue.");
              }}
            >
              <label className="field">
                <span>
                  Your answer{question.required === false ? " (optional)" : ""}
                </span>
                <textarea
                  className="resize-none"
                  aria-required={question.required !== false}
                  aria-invalid={Boolean(error)}
                  aria-describedby={
                    error ? `${form.id}-answer-error` : undefined
                  }
                  maxLength={4000}
                  value={text}
                  placeholder={question.placeholder}
                  onChange={(e) => setText(e.target.value)}
                />
              </label>
              {error && (
                <p id={`${form.id}-answer-error`} role="alert">
                  {error}
                </p>
              )}
              <button className="button" type="submit">
                Continue
              </button>
            </form>
          ) : (
            <div className="stack">
              {question.choices.map((choice) => (
                <button
                  className="button secondary"
                  type="button"
                  key={choice.id}
                  aria-pressed={answers[question.id] === choice.id}
                  onClick={() => answer(choice.id)}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          )}
          {question.required === false && (
            <button
              className="button secondary"
              type="button"
              onClick={() => answer(SKIPPED_ANSWER)}
            >
              Skip this question
            </button>
          )}
        </>
      ) : outcome ? (
        <div aria-live="polite" className="stack">
          <h3 ref={heading} tabIndex={-1}>
            {outcome.title}
          </h3>
          <p>{outcome.body}</p>
          <ul>
            {outcome.outputs.map((output, i) => (
              <li key={i}>{output}</li>
            ))}
          </ul>
          {outcome.ctaUrl && safeDestination(outcome.ctaUrl) && (
            <a className="button" href={outcome.ctaUrl}>
              {outcome.ctaLabel || "Continue"}
            </a>
          )}
          <label className="field">
            <span>Additional context (optional)</span>
            <textarea
              className="resize-none"
              maxLength={4000}
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </label>
          <details>
            <summary>Your answers</summary>
            <pre style={{ whiteSpace: "pre-wrap" }}>{summary}</pre>
          </details>
          <div className="row">
            {form.email && (
              <a
                className="button secondary"
                href={`mailto:${form.email}?subject=${encodeURIComponent(form.emailSubject.replaceAll("{form}", form.name).replaceAll("{outcome}", outcome.title))}&body=${encodeURIComponent(summary)}`}
              >
                Open email draft
              </a>
            )}
            <button
              type="button"
              className="button secondary"
              onClick={download}
            >
              Download summary
            </button>
          </div>
          <p className="muted">
            The email link opens a draft in your email app; nothing is sent
            automatically.
          </p>
        </div>
      ) : (
        <p role="status">This form could not be evaluated.</p>
      )}
      <div className="row">
        {evaluation.path.indexOf(question?.id ?? "") > 0 ||
        (!question && evaluation.path.length > 0) ? (
          <button type="button" className="button secondary" onClick={back}>
            Back
          </button>
        ) : null}
        <button
          type="button"
          className="button secondary"
          onClick={() => {
            setAnswers({});
            setEditing(undefined);
            setText("");
            setContext("");
            setError("");
          }}
        >
          Start again
        </button>
      </div>
    </section>
  );
}
export default FormRunner;
