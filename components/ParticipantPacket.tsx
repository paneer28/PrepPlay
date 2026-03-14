import type { ParticipantRoleplay } from "@/types";

export function ParticipantPacket({ roleplay }: { roleplay: ParticipantRoleplay }) {
  return (
    <section className="surface overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line/80 bg-[linear-gradient(135deg,#fbfdff,#f1f6ff)] p-7 sm:p-9">
        <div>
          <p className="eyebrow">Participant View</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-[-0.05em] sm:text-4xl">
            {roleplay.eventName}
          </h2>
          <p className="mt-3 text-base leading-7 text-muted">{roleplay.cluster}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-muted">
            {roleplay.cluster}
          </span>
          {roleplay.instructionalArea ? (
            <span className="rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-4 py-2 text-sm font-semibold text-white">
              {roleplay.instructionalArea}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 p-7 lg:grid-cols-2 lg:p-9">
        <article className="surface-soft p-6">
          <h3 className="text-xl font-bold">Participant Instructions</h3>
          <ul className="mt-5 space-y-3 text-base leading-7 text-muted">
            {roleplay.participantInstructions.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-accent" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="surface-soft p-6">
          <h3 className="text-xl font-bold">21st Century Skills</h3>
          <ul className="mt-5 space-y-3 text-base leading-7 text-muted">
            {roleplay.skills21stCentury.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-accent" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-[1.8rem] border border-line bg-[#f5f8ff] p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-bold">Performance Indicators</h3>
            <span className="rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Randomized for this round
            </span>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {roleplay.performanceIndicators.map((indicator) => (
              <div key={indicator.id} className="rounded-[1.35rem] border border-line bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  {indicator.code}
                </p>
                <p className="mt-3 text-base leading-7 text-ink">{indicator.text}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.8rem] border border-line bg-white p-7 lg:col-span-2">
          <h3 className="text-xl font-bold">Event Situation</h3>
          <div className="mt-5 space-y-6 text-[1.02rem] leading-8 text-muted">
            {roleplay.eventSituation.split("\n\n").map((paragraph, index) => (
              <p key={`${index}-${paragraph.slice(0, 20)}`}>{paragraph}</p>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
