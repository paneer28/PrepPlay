import type { JudgeEvaluation } from "@/types";

function ScorePill({ score }: { score: number }) {
  return (
    <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink">
      {score}/5
    </span>
  );
}

export function JudgeEvaluationCard({ evaluation }: { evaluation: JudgeEvaluation }) {
  return (
    <section className="surface overflow-hidden text-ink">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line/80 bg-[linear-gradient(135deg,#f1f6ff,#f9fbff)] p-7 sm:p-9">
        <div>
          <p className="eyebrow">Judge View</p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.05em]">
            Feedback and scoring
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-8 text-muted">{evaluation.overallImpression}</p>
        </div>
        <div className="rounded-[1.6rem] border border-line bg-white px-5 py-4 shadow-card">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">Estimated Total</p>
          <p className="mt-2 text-4xl font-bold">
            {evaluation.estimatedTotalScore}
          </p>
          <p className="text-sm text-muted">out of 99</p>
        </div>
      </div>

      <div className="space-y-6 p-7 lg:p-9">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="surface-soft p-6">
            <h3 className="text-xl font-bold">Judge Characterization</h3>
            <p className="mt-4 text-base leading-8 text-muted">{evaluation.judgeCharacterization}</p>
          </article>

          <article className="surface-soft p-6">
            <h3 className="text-xl font-bold">Follow-up Questions</h3>
            <ul className="mt-4 space-y-3">
              {evaluation.followUpQuestions.map((question) => (
                <li key={question} className="rounded-[1.2rem] bg-white px-4 py-4 text-base leading-7 text-ink">
                  {question}
                </li>
              ))}
            </ul>
          </article>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <article className="surface-soft p-6">
            <h3 className="text-xl font-bold">PI-by-PI Scoring</h3>
            <div className="mt-4 space-y-3">
              {evaluation.piScores.map((item) => (
                <div key={item.pi} className="rounded-[1.2rem] bg-white px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="max-w-[85%] text-base leading-7 text-ink">{item.pi}</p>
                    <ScorePill score={item.score} />
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted">{item.reason}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="surface-soft p-6">
            <h3 className="text-xl font-bold">21st Century Skills Scoring</h3>
            <div className="mt-4 space-y-3">
              {evaluation.skillsScores.map((item) => (
                <div key={item.skill} className="rounded-[1.2rem] bg-white px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="max-w-[85%] text-base leading-7 text-ink">{item.skill}</p>
                    <ScorePill score={item.score} />
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted">{item.reason}</p>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[1.8rem] bg-[#eaf7ee] p-6">
            <h3 className="text-xl font-bold text-[#1c7a3d]">Strengths</h3>
            <ul className="mt-4 space-y-2 text-base leading-7 text-[#246c3d]">
              {evaluation.strengths.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </article>

          <article className="rounded-[1.8rem] bg-[#fbf1e2] p-6">
            <h3 className="text-xl font-bold text-[#a66017]">Weaknesses</h3>
            <ul className="mt-4 space-y-2 text-base leading-7 text-[#a8681b]">
              {evaluation.weaknesses.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </article>

          <article className="surface-soft p-6">
            <h3 className="text-xl font-bold">Missed Opportunities</h3>
            <ul className="mt-4 space-y-2 text-base leading-7 text-muted">
              {evaluation.missedOpportunities.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </article>

          <article className="surface-soft p-6">
            <h3 className="text-xl font-bold">Improvement Suggestions</h3>
            <ul className="mt-4 space-y-2 text-base leading-7 text-muted">
              {evaluation.improvementSuggestions.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </article>
        </div>

        <article className="surface-soft p-6">
          <h3 className="text-xl font-bold">Sample High-Scoring Outline</h3>
          <ol className="mt-4 space-y-3 text-base leading-7 text-muted">
            {evaluation.sampleHighScoringOutline.map((item, index) => (
              <li key={item} className="flex gap-3">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </article>
      </div>
    </section>
  );
}
