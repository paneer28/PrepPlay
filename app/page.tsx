import Link from "next/link";

const workflow = [
  {
    step: "01",
    title: "Generate a packet",
    copy: "Choose your event, cluster, difficulty, and PI count to create a fresh DECA-style round."
  },
  {
    step: "02",
    title: "Answer from the participant view",
    copy: "Read only what a competitor would actually see before the judge-side materials stay hidden."
  },
  {
    step: "03",
    title: "Unlock the evaluation",
    copy: "Reveal follow-up questions, scoring, strengths, weaknesses, and better next-step coaching."
  }
];

const features = [
  {
    title: "Participant-first flow",
    copy: "The order mirrors real competition, so you practice decision-making before feedback colors the round."
  },
  {
    title: "Randomized PI sets",
    copy: "Every packet pulls a relevant PI mix so repetition stays useful instead of feeling identical."
  },
  {
    title: "Structured judge view",
    copy: "You get PI coverage, 21st century skills scoring, follow-up questions, and specific improvement notes."
  },
  {
    title: "Fast repeat practice",
    copy: "Generate another round in seconds and keep moving without waiting on any outside service."
  }
];

const proofPoints = [
  "Large participant-facing sheets that are easy to read and actually feel usable on desktop and mobile",
  "Cleaner spacing, calmer color hierarchy, and more polished surfaces across the full site",
  "A focused practice workflow instead of a generic text generator"
];

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className}>
      <path d="m5 12 4.2 4.2L19 6.5" />
    </svg>
  );
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div id="top" className="space-y-20 pb-8 pt-10 lg:space-y-24 lg:pt-14">
      <section className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_440px] lg:items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-3 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-accent shadow-card">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-xs font-bold text-white">
              DR
            </span>
            Forever Free
          </div>

          <div className="space-y-6">
            <h1 className="max-w-[12ch] text-5xl font-bold leading-[0.94] tracking-[-0.06em] text-ink sm:text-7xl">
              Practice the packet first. Review the judge side second.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted sm:text-xl sm:leading-9">
              A cleaner DECA practice site built around the order that actually matters: generate a
              competition-style packet, answer like a competitor, and only then unlock structured judging.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/practice"
              className="rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-8 py-4 text-base font-semibold text-white shadow-card transition hover:scale-[1.01] hover:opacity-95"
            >
              Start Practicing
            </Link>
            <Link
              href="/#workflow"
              className="rounded-full border border-line bg-white px-8 py-4 text-base font-semibold text-ink transition hover:bg-[#f8fbff]"
            >
              See How It Works
            </Link>
          </div>

          <div className="grid max-w-3xl gap-4 sm:grid-cols-3">
            <div className="surface-soft p-5">
              <p className="text-sm font-medium text-muted">Format</p>
              <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-ink">Participant-first</p>
            </div>
            <div className="surface-soft p-5">
              <p className="text-sm font-medium text-muted">Feedback</p>
              <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-ink">Judge-side only after submission</p>
            </div>
            <div className="surface-soft p-5">
              <p className="text-sm font-medium text-muted">Setup</p>
              <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-ink">Offline-ready</p>
            </div>
          </div>
        </div>

        <div className="surface overflow-hidden p-6 sm:p-7">
          <div className="rounded-[1.75rem] border border-line bg-[linear-gradient(180deg,#fcfdff,#f6f9ff)] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Judge Preview</p>
                <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-ink">Roleplay Evaluation</h2>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-card">
                <p className="text-sm font-medium text-muted">Estimated score</p>
                <p className="mt-1 text-4xl font-bold tracking-[-0.05em] text-ink">91</p>
                <p className="mt-1 text-sm text-muted">out of 99</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-[1.4rem] bg-[#eaf7ee] p-5">
                <p className="text-lg font-semibold text-[#1c7a3d]">What went well</p>
                <ul className="mt-3 space-y-2 text-[0.98rem] leading-7 text-[#246c3d]">
                  <li>Clear recommendation and business rationale</li>
                  <li>Professional tone and structured delivery</li>
                  <li>Strong coverage of the key performance indicators</li>
                </ul>
              </div>
              <div className="rounded-[1.4rem] bg-[#f8f1e3] p-5">
                <p className="text-lg font-semibold text-[#a35d18]">What to improve</p>
                <ul className="mt-3 space-y-2 text-[0.98rem] leading-7 text-[#b16818]">
                  <li>Add more specific examples from the scenario</li>
                  <li>Make the closing recommendation more decisive</li>
                </ul>
              </div>
              <div className="rounded-[1.4rem] border border-line bg-white p-5">
                <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted">Follow-up question</p>
                <p className="mt-3 text-lg leading-8 text-ink">
                  How would you measure whether your recommendation is actually improving results?
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="surface p-7 sm:p-9">
        <div className="max-w-2xl">
          <p className="eyebrow">Workflow</p>
          <h2 className="mt-3 section-title">A cleaner practice rhythm from start to finish</h2>
          <p className="mt-4 section-copy">
            Instead of dumping everything into one screen, the site walks you through the actual sequence
            of a DECA roleplay and gives each step enough room to breathe.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {workflow.map((item) => (
            <article key={item.step} className="surface-soft p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">{item.step}</p>
              <h3 className="mt-4 text-2xl font-bold tracking-[-0.03em] text-ink">{item.title}</h3>
              <p className="mt-3 text-base leading-8 text-muted">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="features" className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
        <div className="space-y-6">
          <p className="eyebrow">Why it feels better</p>
          <h2 className="section-title max-w-[11ch]">Less clutter. More actual practice.</h2>
          <p className="section-copy max-w-xl">
            The interface is designed to keep attention on the round itself, with calmer surfaces,
            stronger spacing, and accents that guide the eye instead of fighting for it.
          </p>

          <div className="space-y-4">
            {proofPoints.map((point) => (
              <div key={point} className="flex gap-4 rounded-[1.6rem] border border-line bg-white px-5 py-4 shadow-card">
                <div className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accentSoft text-accent">
                  <CheckIcon className="h-5 w-5" />
                </div>
                <p className="text-lg leading-8 text-ink">{point}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature, index) => (
            <article key={feature.title} className="surface p-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb,#60a5fa)] text-sm font-bold text-white">
                {index + 1}
              </div>
              <h3 className="mt-5 text-2xl font-bold tracking-[-0.03em] text-ink">{feature.title}</h3>
              <p className="mt-3 text-base leading-8 text-muted">{feature.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-12 lg:grid-cols-[1fr_0.95fr] lg:items-center">
        <div className="grid gap-6 sm:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="surface overflow-hidden">
              <div className="flex h-60 items-center justify-center bg-[linear-gradient(135deg,#eaf1ff,#f8fbff)] p-8 text-center">
                <div>
                  <p className="text-lg font-medium text-[#5372a3]">Participant Packet</p>
                  <p className="mt-3 text-3xl font-bold tracking-[-0.04em] text-ink">Only what competitors should see</p>
                </div>
              </div>
            </div>
            <div className="rounded-[2rem] bg-[linear-gradient(135deg,#2563eb,#38bdf8)] p-7 text-white shadow-card">
              <p className="text-3xl font-bold tracking-[-0.04em]">Practice without friction</p>
              <p className="mt-4 text-lg leading-8 text-white/90">
                Fast generation, clearer surfaces, and a much more deliberate visual flow across the full app.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] bg-[linear-gradient(135deg,#6d5efc,#9f7aea)] p-7 text-white shadow-card">
              <p className="text-3xl font-bold tracking-[-0.04em]">Judge Breakdown</p>
              <p className="mt-4 text-lg leading-8 text-white/90">
                Scoring, strengths, weaknesses, follow-up questions, and a clearer outline for the next rep.
              </p>
            </div>
            <div className="surface p-7">
              <p className="eyebrow">Designed for repetition</p>
              <p className="mt-3 text-2xl font-bold tracking-[-0.03em] text-ink">Generate, answer, review, repeat</p>
              <p className="mt-4 text-base leading-8 text-muted">
                The site now reads more like a real product and less like a stack of generic demo cards,
                while preserving the roleplay functionality underneath.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <p className="eyebrow">Product direction</p>
          <h2 className="section-title max-w-[11ch]">More polished, more spacious, and easier to use.</h2>
          <p className="section-copy">
            This pass focuses on cleaner section spacing, calmer color use, and better hierarchy so the
            site feels intentional instead of visually crowded.
          </p>
          <Link
            href="/practice"
            className="inline-flex items-center gap-3 text-lg font-semibold text-accent transition hover:opacity-80"
          >
            Open the practice workspace
            <SparkIcon className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <section className="surface-tint p-8 sm:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">Start now</p>
            <h2 className="mt-3 section-title">Open the workspace and run your next round.</h2>
            <p className="mt-4 section-copy">
              Choose an event, generate a participant packet, type your answer, and reveal the judge-side
              breakdown when you are ready.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/practice"
              className="rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-8 py-4 text-base font-semibold text-white shadow-card transition hover:scale-[1.01] hover:opacity-95"
            >
              Start Practicing
            </Link>
            <Link
              href="/#workflow"
              className="rounded-full border border-line bg-white px-8 py-4 text-base font-semibold text-ink transition hover:bg-[#f8fbff]"
            >
              Review the flow
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
