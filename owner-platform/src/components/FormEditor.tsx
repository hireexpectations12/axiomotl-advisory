"use client";
import { useState } from "react";
import type { FormDefinition, FormEvaluation, Target } from "../lib/types";
import {
  validateForm,
  canChangeQuestionType,
  SKIPPED_ANSWER,
} from "../lib/forms";
import { FormRunner } from "./FormRunner";

const id = () => crypto.randomUUID();
function move<T>(items: T[], index: number, direction: number) {
  const next = [...items];
  const destination = index + direction;
  if (destination >= 0 && destination < items.length)
    [next[index], next[destination]] = [next[destination], next[index]];
  return next;
}
function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {multiline ? (
        <textarea
          className="resize-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}
function TargetSelect({
  form,
  value,
  onChange,
  label,
  optional = false,
}: {
  form: FormDefinition;
  value?: Target;
  onChange: (value: Target | undefined) => void;
  label: string;
  optional?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select
        value={value ? `${value.kind}:${value.id}` : ""}
        onChange={(e) => {
          const [kind, ...rest] = e.target.value.split(":");
          onChange(
            kind
              ? { kind: kind as Target["kind"], id: rest.join(":") }
              : undefined,
          );
        }}
      >
        <option value="">
          {optional ? "Use rule / question default" : "Select destination"}
        </option>
        {value &&
          !(value.kind === "question" ? form.questions : form.outcomes).some(
            (item) => item.id === value.id,
          ) && (
            <option value={`${value.kind}:${value.id}`}>
              Missing: {value.id}
            </option>
          )}
        <optgroup label="Questions">
          {form.questions.map((q) => (
            <option key={q.id} value={`question:${q.id}`}>
              {q.title || q.id}
            </option>
          ))}
        </optgroup>
        <optgroup label="Outcomes">
          {form.outcomes.map((o) => (
            <option key={o.id} value={`outcome:${o.id}`}>
              {o.title || o.id}
            </option>
          ))}
        </optgroup>
      </select>
    </label>
  );
}
function Order({
  index,
  count,
  onMove,
  onRemove,
  label,
}: {
  index: number;
  count: number;
  onMove: (direction: number) => void;
  onRemove: () => void;
  label: string;
}) {
  return (
    <div className="row">
      <button
        className="button secondary"
        type="button"
        disabled={index === 0}
        onClick={() => onMove(-1)}
        aria-label={`Move ${label} up`}
      >
        Move up
      </button>
      <button
        className="button secondary"
        type="button"
        disabled={index === count - 1}
        onClick={() => onMove(1)}
        aria-label={`Move ${label} down`}
      >
        Move down
      </button>
      <button className="button danger" type="button" onClick={onRemove}>
        Remove {label}
      </button>
    </div>
  );
}

export function FormEditor({
  forms,
  onChange,
}: {
  forms: FormDefinition[];
  onChange: (forms: FormDefinition[]) => void;
}) {
  const [selected, setSelected] = useState(forms[0]?.id ?? "");
  const [trace, setTrace] = useState<FormEvaluation>();
  const [previewVersion, setPreviewVersion] = useState(0);
  const [removed, setRemoved] = useState<FormDefinition>();
  const form = forms.find((f) => f.id === selected) ?? forms[0];
  const update = (change: Partial<FormDefinition>) => {
    if (form)
      onChange(forms.map((f) => (f.id === form.id ? { ...f, ...change } : f)));
  };
  const create = () => {
    const qid = id(),
      oid = id(),
      fid = id();
    const next: FormDefinition = {
      id: fid,
      name: "New form",
      startQuestionId: qid,
      questions: [
        {
          id: qid,
          title: "Your question",
          choices: [{ id: id(), label: "An answer" }],
        },
      ],
      outcomes: [
        {
          id: oid,
          title: "Your result",
          body: "",
          outputs: [],
          ctaLabel: "Contact us",
          ctaUrl: "/",
        },
      ],
      rules: [],
      fallbackOutcomeId: oid,
      email: "",
      emailSubject: "{form} — {outcome}",
    };
    onChange([...forms, next]);
    setSelected(fid);
  };
  const validation = form ? validateForm(form) : { errors: [], warnings: [] };
  return (
    <div className="stack">
      <div className="row">
        <label className="field">
          <span>Form</span>
          <select
            value={form?.id ?? ""}
            onChange={(e) => {
              setSelected(e.target.value);
              setTrace(undefined);
            }}
          >
            {forms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="button" onClick={create}>
          Add form
        </button>
      </div>
      {removed && (
        <div className="notice">
          Removed “{removed.name}”.{" "}
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              onChange([...forms, removed]);
              setSelected(removed.id);
              setRemoved(undefined);
            }}
          >
            Undo removal
          </button>
        </div>
      )}
      {form && (
        <>
          <div className="panel stack">
            <h2>Form settings</h2>
            <div className="form-grid">
              <Field
                label="Form name"
                value={form.name}
                onChange={(name) => update({ name })}
              />
              <label className="field">
                <span>First question</span>
                <select
                  value={form.startQuestionId}
                  onChange={(e) => update({ startQuestionId: e.target.value })}
                >
                  {!form.questions.some(
                    (q) => q.id === form.startQuestionId,
                  ) && (
                    <option value={form.startQuestionId}>
                      Missing question
                    </option>
                  )}
                  {form.questions.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Fallback outcome</span>
                <select
                  value={form.fallbackOutcomeId}
                  onChange={(e) =>
                    update({ fallbackOutcomeId: e.target.value })
                  }
                >
                  {!form.outcomes.some(
                    (o) => o.id === form.fallbackOutcomeId,
                  ) && (
                    <option value={form.fallbackOutcomeId}>
                      Missing outcome
                    </option>
                  )}
                  {form.outcomes.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label="Summary email destination"
                value={form.email}
                onChange={(email) => update({ email })}
              />
              <Field
                label="Email subject (supports {form} and {outcome})"
                value={form.emailSubject}
                onChange={(emailSubject) => update({ emailSubject })}
              />
            </div>
            <button
              type="button"
              className="button danger"
              onClick={() => {
                setRemoved(form);
                onChange(forms.filter((f) => f.id !== form.id));
              }}
            >
              Remove form
            </button>
          </div>
          {(validation.errors.length > 0 || validation.warnings.length > 0) && (
            <div className="notice" role="status">
              <h3>Mapping checks</h3>
              <p>
                Removed references stay visible here and must be repaired before
                publication.
              </p>
              <ul>
                {validation.errors.map((error) => (
                  <li key={error}>Required: {error}</li>
                ))}
                {validation.warnings.map((warning) => (
                  <li key={warning}>Review: {warning}</li>
                ))}
              </ul>
            </div>
          )}
          <section className="stack">
            <h2>Questions and answers</h2>
            <p className="muted">
              IDs stay fixed when wording or order changes. Questions are
              required unless you turn off Required answer. Routing: answer
              override, first matching rule, question default, then fallback.
            </p>
            {form.questions.map((q, qi) => {
              const patch = (change: Partial<typeof q>) =>
                update({
                  questions: form.questions.map((item) =>
                    item.id === q.id ? { ...q, ...change } : item,
                  ),
                });
              return (
                <details className="panel" key={q.id}>
                  <summary>
                    {qi + 1}. {q.title || "Untitled question"}
                  </summary>
                  <div className="stack">
                    <small className="muted">ID: {q.id}</small>
                    <Field
                      label="Question"
                      value={q.title}
                      onChange={(title) => patch({ title })}
                    />
                    <Field
                      label="Help text"
                      value={q.help ?? ""}
                      onChange={(help) => patch({ help })}
                    />
                    <label className="field">
                      <span>Answer type</span>
                      <select
                        disabled={!canChangeQuestionType(form, q.id)}
                        aria-describedby={
                          !canChangeQuestionType(form, q.id)
                            ? `${q.id}-type-help`
                            : undefined
                        }
                        value={q.kind ?? "choice"}
                        onChange={(e) =>
                          patch({ kind: e.target.value as "choice" | "text" })
                        }
                      >
                        <option value="choice">Choose one answer</option>
                        <option value="text">Free text</option>
                      </select>
                    </label>
                    {!canChangeQuestionType(form, q.id) && (
                      <p id={`${q.id}-type-help`} className="notice">
                        To change this answer type, first remove conditions
                        referring to this question from these rules:{" "}
                        {form.rules
                          .filter((rule) =>
                            rule.conditions.some(
                              (condition) => condition.questionId === q.id,
                            ),
                          )
                          .map((rule) => rule.label || rule.id)
                          .join(", ")}
                        . Then recreate the conditions for the new answer type.
                      </p>
                    )}
                    <label className="row">
                      <input
                        type="checkbox"
                        checked={q.required !== false}
                        onChange={(event) =>
                          patch({ required: event.target.checked })
                        }
                      />
                      Required answer
                    </label>
                    {q.kind === "text" ? (
                      <Field
                        label="Placeholder"
                        value={q.placeholder ?? ""}
                        onChange={(placeholder) => patch({ placeholder })}
                      />
                    ) : (
                      <>
                        {q.choices.map((choice, ci) => (
                          <div className="panel stack" key={choice.id}>
                            <Field
                              label={`Answer ${ci + 1}`}
                              value={choice.label}
                              onChange={(label) =>
                                patch({
                                  choices: q.choices.map((c) =>
                                    c.id === choice.id ? { ...c, label } : c,
                                  ),
                                })
                              }
                            />
                            <TargetSelect
                              form={form}
                              value={choice.next}
                              optional
                              label="Answer destination override"
                              onChange={(next) =>
                                patch({
                                  choices: q.choices.map((c) =>
                                    c.id === choice.id ? { ...c, next } : c,
                                  ),
                                })
                              }
                            />
                            <Order
                              label="answer"
                              index={ci}
                              count={q.choices.length}
                              onMove={(direction) =>
                                patch({
                                  choices: move(q.choices, ci, direction),
                                })
                              }
                              onRemove={() =>
                                patch({
                                  choices: q.choices.filter(
                                    (c) => c.id !== choice.id,
                                  ),
                                })
                              }
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          className="button secondary"
                          onClick={() =>
                            patch({
                              choices: [
                                ...q.choices,
                                { id: id(), label: "New answer" },
                              ],
                            })
                          }
                        >
                          Add answer
                        </button>
                      </>
                    )}
                    <TargetSelect
                      form={form}
                      value={q.next}
                      optional
                      label="Default next question or outcome"
                      onChange={(next) => patch({ next })}
                    />
                    <Order
                      label="question"
                      index={qi}
                      count={form.questions.length}
                      onMove={(direction) =>
                        update({
                          questions: move(form.questions, qi, direction),
                        })
                      }
                      onRemove={() =>
                        update({
                          questions: form.questions.filter(
                            (item) => item.id !== q.id,
                          ),
                        })
                      }
                    />
                  </div>
                </details>
              );
            })}
            <button
              type="button"
              className="button secondary"
              onClick={() =>
                update({
                  questions: [
                    ...form.questions,
                    {
                      id: id(),
                      title: "New question",
                      choices: [{ id: id(), label: "New answer" }],
                    },
                  ],
                })
              }
            >
              Add question
            </button>
          </section>
          <section className="stack">
            <h2>Rules · first match wins</h2>
            {form.rules.map((rule, ri) => {
              const patch = (change: Partial<typeof rule>) =>
                update({
                  rules: form.rules.map((r) =>
                    r.id === rule.id ? { ...rule, ...change } : r,
                  ),
                });
              return (
                <details key={rule.id} className="panel">
                  <summary>
                    Priority {ri + 1}: {rule.label || "Untitled rule"}
                  </summary>
                  <div className="stack">
                    <Field
                      label="Rule name"
                      value={rule.label}
                      onChange={(label) => patch({ label })}
                    />
                    <label className="field">
                      <span>Evaluate after answering</span>
                      <select
                        value={rule.fromQuestionId}
                        onChange={(e) =>
                          patch({ fromQuestionId: e.target.value })
                        }
                      >
                        {!form.questions.some(
                          (q) => q.id === rule.fromQuestionId,
                        ) && (
                          <option value={rule.fromQuestionId}>
                            Missing question
                          </option>
                        )}
                        {form.questions.map((q) => (
                          <option key={q.id} value={q.id}>
                            {q.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Match</span>
                      <select
                        value={rule.match}
                        onChange={(e) =>
                          patch({ match: e.target.value as "all" | "any" })
                        }
                      >
                        <option value="all">All conditions</option>
                        <option value="any">Any condition</option>
                      </select>
                    </label>
                    {rule.conditions.map((condition, ci) => {
                      const question = form.questions.find(
                        (q) => q.id === condition.questionId,
                      );
                      const change = (next: typeof condition) =>
                        patch({
                          conditions: rule.conditions.map((c, i) =>
                            i === ci ? next : c,
                          ),
                        });
                      return (
                        <div className="form-grid" key={ci}>
                          <label className="field">
                            <span>Condition question</span>
                            <select
                              value={condition.questionId}
                              onChange={(e) => {
                                const q = form.questions.find(
                                  (q) => q.id === e.target.value,
                                );
                                change({
                                  questionId: e.target.value,
                                  answerId: q?.choices[0]?.id ?? "",
                                });
                              }}
                            >
                              {!question && (
                                <option value={condition.questionId}>
                                  Missing question
                                </option>
                              )}
                              {form.questions.map((q) => (
                                <option key={q.id} value={q.id}>
                                  {q.title}
                                </option>
                              ))}
                            </select>
                          </label>
                          {question?.kind === "text" ? (
                            <Field
                              label="Text equals"
                              value={condition.answerId}
                              onChange={(answerId) =>
                                change({ ...condition, answerId })
                              }
                            />
                          ) : (
                            <label className="field">
                              <span>Answer equals</span>
                              <select
                                value={condition.answerId}
                                onChange={(e) =>
                                  change({
                                    ...condition,
                                    answerId: e.target.value,
                                  })
                                }
                              >
                                {!question?.choices.some(
                                  (c) => c.id === condition.answerId,
                                ) && (
                                  <option value={condition.answerId}>
                                    Missing answer
                                  </option>
                                )}
                                {question?.choices.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          )}
                          <button
                            type="button"
                            className="button danger"
                            onClick={() =>
                              patch({
                                conditions: rule.conditions.filter(
                                  (_, i) => i !== ci,
                                ),
                              })
                            }
                          >
                            Remove condition
                          </button>
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() =>
                        patch({
                          conditions: [
                            ...rule.conditions,
                            {
                              questionId: form.questions[0]?.id ?? "",
                              answerId: form.questions[0]?.choices[0]?.id ?? "",
                            },
                          ],
                        })
                      }
                    >
                      Add condition
                    </button>
                    <TargetSelect
                      form={form}
                      label="Rule destination"
                      value={rule.target}
                      onChange={(target) =>
                        patch({ target: target ?? { kind: "outcome", id: "" } })
                      }
                    />
                    <Order
                      label="rule"
                      index={ri}
                      count={form.rules.length}
                      onMove={(direction) =>
                        update({ rules: move(form.rules, ri, direction) })
                      }
                      onRemove={() =>
                        update({
                          rules: form.rules.filter((r) => r.id !== rule.id),
                        })
                      }
                    />
                  </div>
                </details>
              );
            })}
            <button
              type="button"
              className="button secondary"
              onClick={() =>
                update({
                  rules: [
                    ...form.rules,
                    {
                      id: id(),
                      label: "New rule",
                      fromQuestionId: form.questions[0]?.id ?? "",
                      match: "all",
                      conditions: [
                        {
                          questionId: form.questions[0]?.id ?? "",
                          answerId: form.questions[0]?.choices[0]?.id ?? "",
                        },
                      ],
                      target: { kind: "outcome", id: form.fallbackOutcomeId },
                    },
                  ],
                })
              }
            >
              Add rule
            </button>
          </section>
          <section className="stack">
            <h2>Outcomes</h2>
            {form.outcomes.map((outcome, oi) => {
              const patch = (change: Partial<typeof outcome>) =>
                update({
                  outcomes: form.outcomes.map((o) =>
                    o.id === outcome.id ? { ...o, ...change } : o,
                  ),
                });
              return (
                <details className="panel" key={outcome.id}>
                  <summary>{outcome.title || "Untitled outcome"}</summary>
                  <div className="stack">
                    <Field
                      label="Title / recommended service"
                      value={outcome.title}
                      onChange={(title) => patch({ title })}
                    />
                    <Field
                      label="Explanation"
                      multiline
                      value={outcome.body}
                      onChange={(body) => patch({ body })}
                    />
                    <Field
                      label="Deliverables (one per line)"
                      multiline
                      value={outcome.outputs.join("\n")}
                      onChange={(value) =>
                        patch({ outputs: value.split("\n") })
                      }
                    />
                    <Field
                      label="Call-to-action label"
                      value={outcome.ctaLabel}
                      onChange={(ctaLabel) => patch({ ctaLabel })}
                    />
                    <Field
                      label="Call-to-action destination"
                      value={outcome.ctaUrl}
                      onChange={(ctaUrl) => patch({ ctaUrl })}
                    />
                    <Order
                      label="outcome"
                      index={oi}
                      count={form.outcomes.length}
                      onMove={(direction) =>
                        update({ outcomes: move(form.outcomes, oi, direction) })
                      }
                      onRemove={() =>
                        update({
                          outcomes: form.outcomes.filter(
                            (o) => o.id !== outcome.id,
                          ),
                        })
                      }
                    />
                  </div>
                </details>
              );
            })}
            <button
              type="button"
              className="button secondary"
              onClick={() =>
                update({
                  outcomes: [
                    ...form.outcomes,
                    {
                      id: id(),
                      title: "New outcome",
                      body: "",
                      outputs: [],
                      ctaLabel: "Contact us",
                      ctaUrl: "/",
                    },
                  ],
                })
              }
            >
              Add outcome
            </button>
          </section>
          <section className="panel stack">
            <div className="row">
              <h2>Test this mapping</h2>
              <button
                className="button secondary"
                type="button"
                onClick={() => {
                  setPreviewVersion((v) => v + 1);
                  setTrace(undefined);
                }}
              >
                Reset test
              </button>
            </div>
            <FormRunner
              key={`${form.id}:${previewVersion}`}
              form={form}
              onTrace={setTrace}
            />
            {trace && (
              <div className="notice">
                <strong>Evaluation trace</strong>
                <p>
                  Path:{" "}
                  {trace.path
                    .map(
                      (id) =>
                        form.questions.find((q) => q.id === id)?.title ?? id,
                    )
                    .join(" → ")}
                </p>
                <ol>
                  {trace.trace?.map((step, index) => {
                    const question = form.questions.find(
                      (q) => q.id === step.questionId,
                    );
                    return (
                      <li key={`${step.questionId}:${index}`}>
                        {question?.title ?? step.questionId}:{" "}
                        {step.answerId === SKIPPED_ANSWER
                          ? "Skipped"
                          : question?.kind === "text"
                            ? step.answerId
                            : (question?.choices.find(
                                (choice) => choice.id === step.answerId,
                              )?.label ?? step.answerId)}{" "}
                        →{" "}
                        {step.ruleId
                          ? `Rule: ${form.rules.find((rule) => rule.id === step.ruleId)?.label ?? step.ruleId}`
                          : "Answer override, question default or fallback"}{" "}
                        →{" "}
                        {(step.target.kind === "question"
                          ? form.questions
                          : form.outcomes
                        ).find((item) => item.id === step.target.id)?.title ??
                          step.target.id}
                      </li>
                    );
                  })}
                </ol>
                <p>
                  Outcome:{" "}
                  {form.outcomes.find((o) => o.id === trace.outcomeId)?.title ??
                    "Awaiting answers"}
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
export default FormEditor;
