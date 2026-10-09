import type { FormDefinition, Target } from "../lib/types";
import { SKIPPED_ANSWER } from "../lib/forms";

export default function FormMap({ form }: { form: FormDefinition }) {
  const destination = (target: Target) => {
    const item = (
      target.kind === "question" ? form.questions : form.outcomes
    ).find((item) => item.id === target.id);
    return item
      ? `${target.kind === "question" ? "Question" : "Result"}: ${item.title}`
      : `Missing ${target.kind}: ${target.id}`;
  };
  const fallback: Target = { kind: "outcome", id: form.fallbackOutcomeId };
  return (
    <section className="panel stack" aria-label="Questionnaire mapping path">
      <h2>Mapping path</h2>
      <p>
        <strong>Start → </strong>
        {destination({ kind: "question", id: form.startQuestionId })}
      </p>
      <p>
        Each answer follows its direct destination first. Otherwise, the first
        matching rule wins, then the question default, then the form fallback.
        Rules can use earlier answers on the current path.
      </p>
      <p>
        Edit destinations in Questions, conditions and priority in Rules, and
        the starting question and fallback in Settings. Use Preview to test an
        actual answer path.
      </p>
      {form.questions.map((question, index) => {
        const rules = form.rules.filter(
          (rule) => rule.fromQuestionId === question.id,
        );
        const next = destination(question.next ?? fallback);
        const inherited = rules.length
          ? `Check rules below → otherwise ${next}`
          : next;
        return (
          <article key={question.id} className="panel stack">
            <h3>
              {index + 1}. {question.title}
              {question.id === form.startQuestionId ? " · Start" : ""}
            </h3>
            <dl className="form-paths">
              {question.kind === "text" ? (
                <div>
                  <dt>Text answer</dt>
                  <dd>→ {inherited}</dd>
                </div>
              ) : (
                question.choices.map((choice) => (
                  <div key={choice.id}>
                    <dt>{choice.label}</dt>
                    <dd>
                      →{" "}
                      {choice.next
                        ? `${destination(choice.next)} (direct)`
                        : inherited}
                    </dd>
                  </div>
                ))
              )}
              {question.required === false && (
                <div>
                  <dt>Skipped answer</dt>
                  <dd>→ {inherited}</dd>
                </div>
              )}
            </dl>
            {rules.length > 0 && (
              <ol aria-label={`Rules for ${question.title}`}>
                {rules.map((rule) => (
                  <li key={rule.id}>
                    <strong>{rule.label || "Untitled rule"}</strong>:{" "}
                    {rule.conditions.length === 0 ? (
                      "No conditions — this rule never matches"
                    ) : (
                      <>
                        {rule.match === "all" ? "All of" : "Any of"}{" "}
                        {rule.conditions
                          .map((condition) => {
                            const source = form.questions.find(
                              (q) => q.id === condition.questionId,
                            );
                            const answer =
                              condition.answerId === SKIPPED_ANSWER
                                ? "Skipped"
                                : source?.kind === "text"
                                  ? condition.answerId
                                  : (source?.choices.find(
                                      (c) => c.id === condition.answerId,
                                    )?.label ??
                                    `Missing answer: ${condition.answerId}`);
                            return `${source?.title ?? `Missing question: ${condition.questionId}`} = “${answer}”`;
                          })
                          .join(rule.match === "all" ? " AND " : " OR ")}{" "}
                        → {destination(rule.target)}
                      </>
                    )}
                  </li>
                ))}
              </ol>
            )}
            <p>
              <strong>
                {question.next ? "Question default" : "Form fallback"} →{" "}
              </strong>
              {next}
            </p>
          </article>
        );
      })}
      <h3>Results</h3>
      <ul>
        {form.outcomes.map((outcome) => (
          <li key={outcome.id}>
            <strong>{outcome.title}</strong>
            {outcome.id === form.fallbackOutcomeId ? " · Fallback" : ""} →{" "}
            {outcome.ctaLabel} ({outcome.ctaUrl || "No link configured"})
          </li>
        ))}
      </ul>
    </section>
  );
}
