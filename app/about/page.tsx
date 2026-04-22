import Link from "next/link";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/motion-wrappers";

const pillars = [
  {
    eyebrow: "The problem",
    title: "DECA prep was backwards",
    body:
      "Every existing tool shows you the judge materials first — scoring sheets, example answers, coaching notes. That trains you to reverse-engineer feedback, not make real decisions under pressure.",
    color: "from-red-500/10 to-orange-500/5",
    border: "border-red-200/60",
  },
  {
    eyebrow: "The solution",
    title: "Participant-first, always",
    body:
      "PrepPlay withholds the judge side until after you submit. You read the same packet a competitor would read, answer in your own words, and only then unlock scoring, strengths, follow-ups, and coaching.",
    color: "from-blue-500/10 to-cyan-500/5",
    border: "border-blue-200/60",
  },
  {
    eyebrow: "What's next",
    title: "Built for fast reps",
    body:
      "Generate a new round in seconds, practice with a 10-minute timer, and get structured feedback every time. The goal is to make high-quality DECA prep as repeatable as possible.",
    color: "from-violet-500/10 to-purple-500/5",
    border: "border-violet-200/60",
  },
];

const values = [
  { label: "DECA clusters", value: "5" },
  { label: "Events supported", value: "50+" },
  { label: "Cost to use", value: "$0" },
  { label: "Account required", value: "No" },
];

export default function AboutPage() {
  return (
    <div className="space-y-16 pb-12 pt-8">

      {/* Hero */}
      <FadeIn>
        <section className="surface-dark relative overflow-hidden px-8 py-14 sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-blue-600 opacity-10 blur-3xl" />
            <div className="absolute -bottom-16 right-0 h-64 w-64 rounded-full bg-violet-600 opacity-10 blur-3xl" />
          </div>
          <div className="relative">
            <p className="eyebrow-light">About PrepPlay</p>
            <h1 className="mt-4 max-w-[14ch] text-4xl font-bold leading-[0.95] tracking-[-0.05em] text-white sm:text-6xl">
              Practice the way competition actually works.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">
              PrepPlay is a DECA roleplay practice tool that mirrors the real competition sequence —
              participant packet first, judge-side evaluation only after you commit to your answer.
            </p>
            <Link
              href="/practice"
              className="mt-8 inline-flex rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-ink transition hover:scale-[1.02] hover:bg-blue-50"
            >
              Open the workspace
            </Link>
          </div>
        </section>
      </FadeIn>

      {/* Stats */}
      <FadeIn>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {values.map((v) => (
            <div key={v.label} className="surface p-6 text-center">
              <p className="text-3xl font-bold tracking-[-0.05em] text-ink">{v.value}</p>
              <p className="mt-2 text-sm font-medium text-muted">{v.label}</p>
            </div>
          ))}
        </div>
      </FadeIn>

      {/* Pillars */}
      <Stagger className="grid gap-6 lg:grid-cols-3">
        {pillars.map((p) => (
          <StaggerItem key={p.title}>
            <article className={`h-full rounded-[1.8rem] border bg-gradient-to-br ${p.color} ${p.border} p-7`}>
              <p className="eyebrow">{p.eyebrow}</p>
              <h2 className="mt-4 text-2xl font-bold tracking-[-0.04em] text-ink">{p.title}</h2>
              <p className="mt-3 text-base leading-7 text-muted">{p.body}</p>
            </article>
          </StaggerItem>
        ))}
      </Stagger>

      {/* CTA */}
      <FadeIn>
        <div className="surface p-8 sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="eyebrow">Ready to practice?</p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-ink">
                Fill in the placeholder copy and ship.
              </h2>
              <p className="mt-3 text-base leading-7 text-muted">
                This page is ready for your founder story, DECA background, and product vision.
                Send the copy and it goes in here.
              </p>
            </div>
            <Link
              href="/practice"
              className="shrink-0 rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-8 py-4 text-base font-semibold text-white shadow-[0_8px_24px_rgba(37,99,235,0.3)] transition hover:scale-[1.02] hover:opacity-95"
            >
              Start Practicing
            </Link>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
