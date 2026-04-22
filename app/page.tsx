import Link from "next/link";
import {
  FadeIn,
  HeroFadeIn,
  Stagger,
  StaggerItem,
  HoverCard,
  ScaleIn,
} from "@/components/ui/motion-wrappers";

const workflow = [
  {
    step: "01",
    title: "Generate a packet",
    copy: "Choose your event, cluster, difficulty, and PI count to create a fresh DECA-style round.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h4" />
      </svg>
    ),
  },
  {
    step: "02",
    title: "Answer as a competitor",
    copy: "Read only what a competitor would actually see. Judge-side materials stay hidden until you submit.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
  },
  {
    step: "03",
    title: "Unlock the evaluation",
    copy: "Reveal follow-up questions, scoring, strengths, weaknesses, and better next-step coaching.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="m9 12 2 2 4-4" />
        <path d="M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
      </svg>
    ),
  },
];

const features = [
  {
    title: "Participant-first flow",
    copy: "The order mirrors real competition, so you practice decision-making before feedback colors the round.",
    color: "from-blue-500 to-cyan-400",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M12 2L2 7l10 5 10-5-10-5Z" />
        <path d="m2 17 10 5 10-5" />
        <path d="m2 12 10 5 10-5" />
      </svg>
    ),
  },
  {
    title: "Randomized PI sets",
    copy: "Every packet pulls a relevant PI mix so repetition stays useful instead of feeling identical.",
    color: "from-violet-500 to-purple-400",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M16 3h5v5M4 20 21 3" />
        <path d="M21 16v5h-5M15 15l6 6M4 4l5 5" />
      </svg>
    ),
  },
  {
    title: "Structured judge view",
    copy: "PI coverage, 21st century skills scoring, follow-up questions, and specific improvement notes.",
    color: "from-emerald-500 to-teal-400",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    title: "Fast repeat practice",
    copy: "Generate another round in seconds and keep moving without waiting on any outside service.",
    color: "from-orange-500 to-amber-400",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8Z" />
      </svg>
    ),
  },
];

const stats = [
  { label: "DECA Events", value: "50+" },
  { label: "Clusters covered", value: "5" },
  { label: "Prep time", value: "10 min" },
  { label: "Cost", value: "Free" },
];

export default function HomePage() {
  return (
    <div id="top" className="pb-8 pt-10 lg:pt-14">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="grid gap-14 lg:grid-cols-[1fr_460px] lg:items-center">
        <div className="space-y-8">
          <HeroFadeIn delay={0}>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-accent shadow-card">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              Free Forever — no account required
            </div>
          </HeroFadeIn>

          <HeroFadeIn delay={0.08}>
            <h1 className="max-w-[13ch] text-5xl font-bold leading-[0.93] tracking-[-0.06em] text-ink sm:text-6xl lg:text-7xl">
              Practice the{" "}
              <span className="gradient-text">packet first.</span>
              {" "}Review the judge side second.
            </h1>
          </HeroFadeIn>

          <HeroFadeIn delay={0.15}>
            <p className="max-w-xl text-lg leading-8 text-muted sm:text-xl sm:leading-9">
              A DECA practice tool built around the order that actually matters — generate a
              competition-style packet, answer like a competitor, then unlock structured judging.
            </p>
          </HeroFadeIn>

          <HeroFadeIn delay={0.2}>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/practice"
                className="rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-8 py-4 text-base font-semibold text-white shadow-[0_8px_24px_rgba(37,99,235,0.35)] transition hover:scale-[1.02] hover:opacity-95"
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
          </HeroFadeIn>

          <HeroFadeIn delay={0.27}>
            <div className="grid max-w-lg grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="surface-soft p-4 text-center">
                  <p className="text-2xl font-bold tracking-[-0.04em] text-ink">{s.value}</p>
                  <p className="mt-1 text-xs font-medium text-muted">{s.label}</p>
                </div>
              ))}
            </div>
          </HeroFadeIn>
        </div>

        {/* Hero preview card */}
        <HeroFadeIn delay={0.18} className="animate-float">
          <div className="surface overflow-hidden shadow-[0_24px_64px_rgba(15,23,42,0.12)]">
            <div className="border-b border-line bg-[linear-gradient(180deg,#f8fbff,#f2f6ff)] px-7 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">Judge View</p>
                  <p className="mt-1.5 text-xl font-bold tracking-[-0.04em] text-ink">Roleplay Evaluation</p>
                </div>
                <div className="rounded-[1.2rem] border border-line bg-white px-4 py-3 text-right shadow-card">
                  <p className="text-xs font-semibold text-muted">Score</p>
                  <p className="mt-0.5 text-3xl font-bold tracking-[-0.05em] text-ink">91</p>
                  <p className="text-xs text-muted">/ 99</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-5">
              <div className="rounded-[1.25rem] bg-[#eaf7ee] px-5 py-4">
                <div className="flex items-center gap-2 text-[#1c7a3d]">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-semibold">What went well</p>
                </div>
                <ul className="mt-2.5 space-y-1.5 text-sm leading-6 text-[#246c3d]">
                  <li>Clear recommendation and business rationale</li>
                  <li>Professional tone and structured delivery</li>
                  <li>Strong PI coverage throughout the response</li>
                </ul>
              </div>

              <div className="rounded-[1.25rem] bg-[#fff8ec] px-5 py-4">
                <div className="flex items-center gap-2 text-[#a35d18]">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
                    <path d="M10 1a6 6 0 0 0-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.644a.75.75 0 0 0 .572.729 6.016 6.016 0 0 0 2.856 0A.75.75 0 0 0 12 15.1v-.644c0-1.013.762-1.957 1.815-2.825A6 6 0 0 0 10 1ZM9.25 12.5v-1h1.5v1h-1.5Z" />
                  </svg>
                  <p className="text-sm font-semibold">What to improve</p>
                </div>
                <ul className="mt-2.5 space-y-1.5 text-sm leading-6 text-[#a35d18]">
                  <li>Add specific examples from the scenario</li>
                  <li>Make the closing recommendation more decisive</li>
                </ul>
              </div>

              <div className="rounded-[1.25rem] border border-line bg-white px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Follow-up question</p>
                <p className="mt-2 text-sm leading-6 text-ink">
                  How would you measure whether your recommendation is actually improving results?
                </p>
              </div>
            </div>
          </div>
        </HeroFadeIn>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section id="workflow" className="mt-24 lg:mt-32">
        <FadeIn>
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Workflow</p>
            <h2 className="mt-4 section-title">A cleaner practice rhythm, start to finish</h2>
            <p className="mt-4 section-copy">
              Instead of dumping everything into one screen, the site walks you through the actual
              sequence of a DECA roleplay and gives each step room to breathe.
            </p>
          </div>
        </FadeIn>

        <Stagger className="mt-12 grid gap-5 lg:grid-cols-3">
          {workflow.map((item, i) => (
            <StaggerItem key={item.step}>
              <HoverCard>
                <div className="surface relative h-full overflow-hidden p-7">
                  <div className="absolute right-6 top-6 text-6xl font-black tracking-tighter text-blue-50 select-none">
                    {item.step}
                  </div>
                  <div className="relative">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-white shadow-[0_8px_20px_rgba(37,99,235,0.3)]">
                      {item.icon}
                    </div>
                    <h3 className="mt-5 text-xl font-bold tracking-[-0.03em] text-ink">{item.title}</h3>
                    <p className="mt-3 text-base leading-7 text-muted">{item.copy}</p>
                  </div>
                </div>
              </HoverCard>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section id="features" className="mt-24 lg:mt-32">
        <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:items-start">
          <FadeIn className="space-y-6 lg:sticky lg:top-28">
            <p className="eyebrow">Why it feels better</p>
            <h2 className="section-title max-w-[10ch]">Less clutter. More real practice.</h2>
            <p className="section-copy max-w-md">
              Calmer surfaces, stronger spacing, and accents that guide the eye — designed so attention
              stays on the round, not the interface.
            </p>
            <Link
              href="/practice"
              className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(37,99,235,0.3)] transition hover:scale-[1.02] hover:opacity-95"
            >
              Open the workspace
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
              </svg>
            </Link>
          </FadeIn>

          <Stagger className="grid gap-5 sm:grid-cols-2">
            {features.map((feature) => (
              <StaggerItem key={feature.title}>
                <HoverCard>
                  <div className="surface h-full p-6">
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} text-white shadow-lg`}>
                      {feature.icon}
                    </div>
                    <h3 className="mt-4 text-lg font-bold tracking-[-0.02em] text-ink">{feature.title}</h3>
                    <p className="mt-2.5 text-sm leading-7 text-muted">{feature.copy}</p>
                  </div>
                </HoverCard>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── Split visual section ──────────────────────────────── */}
      <section className="mt-24 lg:mt-32">
        <FadeIn>
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-[2rem] border border-[#c7deff] bg-[linear-gradient(145deg,#eef5ff,#f8fbff)] p-8">
              <p className="eyebrow">Participant view</p>
              <h3 className="mt-4 text-2xl font-bold tracking-[-0.04em] text-ink">
                Only what competitors should see
              </h3>
              <p className="mt-3 text-base leading-7 text-muted">
                Scenario, instructions, skills, and a randomized PI set — no judge materials in sight
                until you lock in your answer.
              </p>
            </div>

            <div className="rounded-[2rem] bg-[linear-gradient(135deg,#2563eb,#1d4ed8)] p-8 text-white lg:col-span-1">
              <p className="eyebrow-light">Practice flow</p>
              <h3 className="mt-4 text-2xl font-bold tracking-[-0.04em]">
                Generate, answer, review, repeat
              </h3>
              <p className="mt-3 text-base leading-7 text-white/80">
                Fast generation and a deliberate visual flow so you can run back-to-back rounds without
                friction.
              </p>
            </div>

            <div className="rounded-[2rem] bg-[linear-gradient(135deg,#6d28d9,#7c3aed)] p-8 text-white">
              <p className="eyebrow-light">Judge breakdown</p>
              <h3 className="mt-4 text-2xl font-bold tracking-[-0.04em]">
                Scoring, strengths, follow-ups
              </h3>
              <p className="mt-3 text-base leading-7 text-white/80">
                PI scores, 21st century skills, weaknesses, missed opportunities, and a high-scoring
                outline for next time.
              </p>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── Dark CTA banner ──────────────────────────────────── */}
      <ScaleIn className="mt-24 lg:mt-32">
        <div className="surface-dark overflow-hidden px-8 py-14 sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
            <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-blue-600 opacity-10 blur-3xl" />
            <div className="absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-violet-600 opacity-10 blur-3xl" />
          </div>
          <div className="relative flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow-light">Start now</p>
              <h2 className="mt-4 text-4xl font-bold leading-tight tracking-[-0.05em] text-white sm:text-5xl">
                Open the workspace and run your next round.
              </h2>
              <p className="mt-5 text-lg leading-8 text-white/70">
                Choose an event, generate a participant packet, type your answer, and reveal the
                judge-side breakdown when you are ready.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-3">
              <Link
                href="/practice"
                className="rounded-full bg-white px-8 py-4 text-base font-semibold text-ink transition hover:scale-[1.02] hover:bg-blue-50"
              >
                Start Practicing
              </Link>
              <Link
                href="/#workflow"
                className="rounded-full border border-white/20 bg-white/10 px-8 py-4 text-base font-semibold text-white transition hover:bg-white/15"
              >
                See the workflow
              </Link>
            </div>
          </div>
        </div>
      </ScaleIn>
    </div>
  );
}
