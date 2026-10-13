import { PracticeTimer } from "@/components/PracticeTimer";
import { AreaTag, Tag } from "@/components/ds/Tag";
import type { ParticipantRoleplay } from "@/types";

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 space-y-2 text-fg">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span aria-hidden="true" className="mt-[0.6em] h-2 w-2 shrink-0 rounded-full bg-brand" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ParticipantPacket({ roleplay }: { roleplay: ParticipantRoleplay }) {
  return (
    <section aria-labelledby="packet-title" className="overflow-hidden rounded-card border-[1.5px] border-rule bg-page">
      <div className="space-y-3 p-6 sm:p-8">
        <p className="text-label font-bold text-fg-muted">Participant view</p>
        <h2 id="packet-title" className="max-w-3xl font-display text-h2 font-extrabold text-fg">
          {roleplay.eventName}
        </h2>
        <div className="flex flex-wrap gap-2">
          <Tag>{roleplay.cluster}</Tag>
          {roleplay.instructionalArea ? <AreaTag area={roleplay.instructionalArea} /> : null}
        </div>
      </div>

      <PracticeTimer autoStart />

      <div className="divide-y-[1.5px] divide-rule px-6 sm:px-8">
        <div className="grid gap-8 py-7 lg:grid-cols-2">
          <div>
            <h3 className="font-display text-h4 font-bold text-fg">Participant instructions</h3>
            <BulletList items={roleplay.participantInstructions} />
          </div>
          <div>
            <h3 className="font-display text-h4 font-bold text-fg">21st Century Skills</h3>
            <BulletList items={roleplay.skills21stCentury} />
          </div>
        </div>

        <div className="py-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-h4 font-bold text-fg">Performance indicators</h3>
            <Tag tone="brand">Randomized for this round</Tag>
          </div>
          <ul className="mt-3 divide-y-[1.5px] divide-rule">
            {roleplay.performanceIndicators.map((indicator) => (
              <li key={indicator.id} className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-baseline sm:gap-4">
                <span className="w-24 shrink-0 font-display text-small font-extrabold text-brand-text">{indicator.code}</span>
                <span className="text-fg">{indicator.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {roleplay.financialAnalysis ? (
          <div className="py-7">
            <div className="space-y-5 rounded-control bg-surface p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-label font-bold text-fg-muted">Financial analysis prompt</p>
                  <h3 className="mt-1 font-display text-h4 font-bold text-fg">{roleplay.financialAnalysis.title}</h3>
                </div>
                <Tag>Solve during prep time</Tag>
              </div>
              <p className="text-fg">{roleplay.financialAnalysis.prompt}</p>
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <h4 className="text-small font-extrabold text-fg">Formulas</h4>
                  <ul className="mt-2 space-y-2">
                    {roleplay.financialAnalysis.formulas.map((formula) => (
                      <li key={formula} className="rounded-lg bg-page px-4 py-2.5 font-semibold text-fg">
                        {formula}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-small font-extrabold text-fg">Given data</h4>
                  <dl className="mt-2 divide-y-[1.5px] divide-rule rounded-lg bg-page px-4">
                    {roleplay.financialAnalysis.inputs.map((input) => (
                      <div key={input.label} className="flex items-start justify-between gap-4 py-2.5">
                        <dt className="text-fg-muted">{input.label}</dt>
                        <dd className="text-right font-extrabold tabular-nums text-fg">{input.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
              <div>
                <h4 className="text-small font-extrabold text-fg">What you need to do</h4>
                <BulletList items={roleplay.financialAnalysis.requiredOutputs} />
              </div>
            </div>
          </div>
        ) : null}

        <div className="py-7">
          <h3 className="font-display text-h4 font-bold text-fg">Event situation</h3>
          <div className="mt-3 max-w-[72ch] space-y-5 text-fg">
            {roleplay.eventSituation.split("\n\n").map((paragraph, index) => (
              <p key={`${index}-${paragraph.slice(0, 20)}`}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
