import { CheckIcon, LightbulbIcon, TargetIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";
import { StatTile } from "@/components/ds/StatTile";
import { Tag } from "@/components/ds/Tag";
import { scoreTint } from "@/lib/score-scale";
import type { JudgeEvaluation } from "@/types";

function ScoreChip({ score }: { score: number }) {
  return (
    <span
      className="shrink-0 rounded-full px-2.5 py-0.5 text-label font-extrabold tabular-nums text-fg"
      style={{ background: scoreTint((score / 5) * 100) }}
    >
      {score}/5
    </span>
  );
}

function Section({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={`py-7 ${className}`}>
      <h3 className="font-display text-h4 font-bold text-fg">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function IconList({ items, icon, tone }: { items: string[]; icon: ReactNode; tone: string }) {
  return (
    <ul className="space-y-2 text-fg">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span aria-hidden="true" className={`mt-1 shrink-0 ${tone}`}>
            {icon}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ScoredList({ rows }: { rows: Array<{ key: string; label: string; score: number; reason: string }> }) {
  return (
    <ul className="divide-y-[1.5px] divide-rule">
      {rows.map((row) => (
        <li key={row.key} className="py-3">
          <div className="flex items-start justify-between gap-3">
            <p className="font-bold text-fg">{row.label}</p>
            <ScoreChip score={row.score} />
          </div>
          <p className="mt-1 text-small text-fg-muted">{row.reason}</p>
        </li>
      ))}
    </ul>
  );
}

export function JudgeEvaluationCard({ evaluation }: { evaluation: JudgeEvaluation }) {
  const finance = evaluation.financialAnalysisReview;

  return (
    <section aria-labelledby="judge-title" className="overflow-hidden rounded-card border-[1.5px] border-rule bg-page">
      <div className="flex flex-wrap items-start justify-between gap-6 p-6 sm:p-8">
        <div className="max-w-3xl space-y-2">
          <p className="text-label font-bold text-fg-muted">Judge view</p>
          <h2 id="judge-title" className="font-display text-h2 font-extrabold text-fg">
            Feedback and scoring
          </h2>
          <p className="text-fg">{evaluation.overallImpression}</p>
        </div>
        <StatTile value={evaluation.estimatedTotalScore} label="Estimated total" detail="out of 99" />
      </div>

      <div className="divide-y-[1.5px] divide-rule border-t-[1.5px] border-rule px-6 sm:px-8">
        <div className="grid gap-x-10 lg:grid-cols-[0.9fr_1.1fr]">
          <Section title="Judge characterization">
            <p className="text-fg">{evaluation.judgeCharacterization}</p>
          </Section>
          <Section title="Follow-up questions">
            <ol className="space-y-2.5">
              {evaluation.followUpQuestions.map((question, index) => (
                <li key={question} className="flex gap-3 text-fg">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-tint text-label font-extrabold text-brand-text">
                    {index + 1}
                  </span>
                  <span>{question}</span>
                </li>
              ))}
            </ol>
          </Section>
        </div>

        {finance ? (
          <div className="py-7">
            <div className="space-y-5 rounded-control bg-surface p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-label font-bold text-fg-muted">Finance solution</p>
                  <h3 className="mt-1 font-display text-h4 font-bold text-fg">{finance.title}</h3>
                </div>
                <Tag>Revealed after judging</Tag>
              </div>
              <p className="max-w-4xl text-fg">{finance.summary}</p>

              <div>
                <h4 className="text-small font-extrabold text-fg">Correct outputs</h4>
                <dl className="mt-2 grid gap-3 md:grid-cols-2">
                  {finance.finalAnswers.map((answer) => (
                    <div key={answer.label} className="rounded-lg bg-page px-4 py-3">
                      <dt className="text-label font-bold text-fg-muted">{answer.label}</dt>
                      <dd className="mt-0.5 font-display text-h4 font-extrabold tabular-nums text-fg">{answer.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <ol className="grid gap-3 lg:grid-cols-2">
                {finance.steps.map((step) => (
                  <li key={step.label} className="rounded-lg bg-page p-4">
                    <p className="text-label font-bold text-fg-muted">{step.label}</p>
                    <p className="mt-1 font-semibold text-fg">{step.equation}</p>
                    <p className="mt-1 font-display text-h4 font-extrabold tabular-nums text-fg">{step.result}</p>
                    <p className="mt-1 text-small text-fg-muted">{step.explanation}</p>
                  </li>
                ))}
              </ol>

              <div>
                <h4 className="text-small font-extrabold text-fg">Recommended conclusion</h4>
                <p className="mt-1 text-fg">{finance.recommendation}</p>
                <p className="mt-3 text-label font-bold text-fg-muted">Sample judge-ready wrap-up</p>
                <p className="mt-1 text-fg">{finance.sampleConclusion}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-x-10 lg:grid-cols-2">
          <Section title="PI-by-PI scoring">
            <ScoredList rows={evaluation.piScores.map((item) => ({ key: item.pi, label: item.pi, score: item.score, reason: item.reason }))} />
          </Section>
          <Section title="21st Century Skills scoring">
            <ScoredList
              rows={evaluation.skillsScores.map((item) => ({ key: item.skill, label: item.skill, score: item.score, reason: item.reason }))}
            />
          </Section>
        </div>

        <div className="grid gap-x-10 lg:grid-cols-2">
          <Section title="Strengths">
            <IconList items={evaluation.strengths} tone="text-correct" icon={<CheckIcon size={16} weight="bold" />} />
          </Section>
          <Section title="Weaknesses">
            <IconList items={evaluation.weaknesses} tone="text-wrong" icon={<XIcon size={16} weight="bold" />} />
          </Section>
          <Section title="Missed opportunities">
            <IconList items={evaluation.missedOpportunities} tone="text-fg-muted" icon={<TargetIcon size={16} weight="bold" />} />
          </Section>
          <Section title="Improvement suggestions">
            <IconList items={evaluation.improvementSuggestions} tone="text-brand-text" icon={<LightbulbIcon size={16} weight="bold" />} />
          </Section>
        </div>

        <Section title="Sample high-scoring outline">
          <ol className="space-y-2.5">
            {evaluation.sampleHighScoringOutline.map((item, index) => (
              <li key={item} className="flex gap-3 text-fg">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand text-label font-extrabold text-white">
                  {index + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </Section>
      </div>
    </section>
  );
}
