import {
  ChartBarIcon,
  ChatTextIcon,
  CheckCircleIcon,
  FileTextIcon,
  LightningIcon,
  QuotesIcon,
  WarningCircleIcon
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ds/Button";
import { AchievementSticker } from "@/components/ds/AchievementSticker";
import { Tag } from "@/components/ds/Tag";
import { FadeIn, ScaleIn, Stagger, StaggerItem } from "@/components/ui/motion-wrappers";

const pillars = [
  {
    eyebrow: "The problem",
    icon: WarningCircleIcon,
    tone: "bg-wrong-tint text-wrong-text",
    title: "DECA prep was backwards",
    body:
      "Every existing tool shows you the judge materials first — scoring sheets, example answers, coaching notes. That trains you to reverse-engineer feedback, not make real decisions under pressure.",
  },
  {
    eyebrow: "The solution",
    icon: CheckCircleIcon,
    tone: "bg-correct-tint text-correct-text",
    title: "Participant-first, always",
    body:
      "PrepPlay withholds the judge side until after you submit. You read the same packet a competitor would read, answer in your own words, and only then unlock scoring, strengths, follow-ups, and coaching.",
  },
  {
    eyebrow: "What's next",
    icon: LightningIcon,
    tone: "bg-streak-tint text-streak-text",
    title: "Built for fast reps",
    body:
      "Generate a new round in seconds, practice with a 10-minute timer, and get structured feedback every time. The goal is to make high-quality DECA prep as repeatable as possible.",
  },
];

export default function AboutPage() {
  return (
    <div className="-mb-20 -mt-2 space-y-24">
      {/* Hero + the three cards fit on one screen */}
      <div className="space-y-8">
        <section className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,400px)] xl:items-center">
          <FadeIn className="space-y-4">
            <Tag tone="brand">About PrepPlay</Tag>
            <h1 className="max-w-[22ch] font-display text-[38px] font-extrabold leading-[1.02] tracking-[-0.03em] text-fg sm:text-[46px]">
              Practice the way competition actually works.
            </h1>
            <p className="max-w-xl text-fg">
              PrepPlay is a DECA roleplay practice tool that mirrors the real competition sequence — participant packet first,
              judge-side evaluation only after you commit to your answer.
            </p>
            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:gap-5">
              <ButtonLink href="/practice" size="lg">
                Open the workspace
              </ButtonLink>
              <p className="text-small font-semibold text-fg-muted">Free · No account required · 50+ events</p>
            </div>
          </FadeIn>
          {/* Hidden only on small laptops, where it would push the cards below the fold. */}
          <FadeIn className="lg:hidden xl:block">
            <RoundOrder />
          </FadeIn>
        </section>

        <Stagger className="grid gap-4 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <StaggerItem key={pillar.title} className="h-full">
              <article className="h-full rounded-card border-[1.5px] border-rule bg-page p-5 shadow-[0_4px_0_var(--rule)]">
                <div className="flex items-center gap-3">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-control ${pillar.tone}`}>
                    <pillar.icon size={20} weight="bold" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-label font-bold text-fg-muted">{pillar.eyebrow}</p>
                    <h2 className="font-display text-h4 font-extrabold leading-tight text-fg">{pillar.title}</h2>
                  </div>
                </div>
                <p className="mt-3 text-small text-fg">{pillar.body}</p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>

      {/* Founder */}
      <FadeIn>
        <section aria-labelledby="story-title" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-center">
          <div className="space-y-3">
            <Tag tone="brand">Meet the founder</Tag>
            <h2 id="story-title" className="font-display text-h2 font-extrabold text-fg sm:text-[40px] sm:leading-tight">
              Why I built PrepPlay
            </h2>
            <p className="text-fg-muted">PrepPlay was started by a DECA competitor who knows what game day feels like.</p>
            <Link href="/contributors" className="inline-block text-small font-bold text-fg-muted underline-offset-4 hover:text-brand-text hover:underline">
              Meet the contributors →
            </Link>
          </div>
          <figure className="relative rounded-[20px] border-[1.5px] border-rule bg-page p-7 shadow-[0_6px_0_var(--rule)]">
            <span className="absolute -top-5 left-7 grid h-10 w-10 place-items-center rounded-control bg-brand text-white shadow-[0_3px_0_var(--brand-edge)]">
              <QuotesIcon size={20} weight="fill" aria-hidden="true" />
            </span>
            <blockquote className="pt-2 font-display text-h3 font-extrabold leading-snug text-fg">
              “I started this platform to help others achieve success in DECA.”
            </blockquote>
            <figcaption className="mt-6 flex flex-wrap items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-tint font-display text-h4 font-extrabold text-brand-text">
                PP
              </span>
              <span>
                <span className="block font-extrabold text-fg">Praneeth Pendeyala</span>
                <span className="block text-small text-fg-muted">Founder, PrepPlay</span>
              </span>
            </figcaption>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Top 20 ICDC", "CDC 1st Place", "Top Test ICDC"].map((honour, index) => (
                <AchievementSticker key={honour} tilt={index % 2 ? "right" : "left"}>
                  {honour}
                </AchievementSticker>
              ))}
            </div>
          </figure>
        </section>
      </FadeIn>

      <ScaleIn className="pb-24">
        <section className="flex flex-col gap-8 rounded-[24px] bg-brand px-7 py-12 text-white shadow-[0_6px_0_var(--brand-edge)] sm:px-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h2 className="font-display text-h2 font-extrabold leading-tight sm:text-[40px]">Ready to practice?</h2>
            <p className="font-semibold text-white/90">Generate a participant packet and run your first round in a few seconds.</p>
          </div>
          <Link
            href="/practice"
            className="btn btn-lg shrink-0 [--btn-bg:#fff] [--btn-edge:#c9bffd] [--btn-fg:#3f25c9] focus-visible:outline-white"
          >
            Start Practicing
          </Link>
        </section>
      </ScaleIn>
    </div>
  );
}

// The PrepPlay order as three playful, overlapping cards.
function RoundOrder() {
  return (
    <div aria-hidden="true" className="relative mx-auto h-[250px] w-full max-w-[400px]">
      <StepCard className="left-0 top-2 -rotate-3" step="1" title="Participant packet" icon={<FileTextIcon size={20} weight="bold" />} tone="bg-brand-tint text-brand-text">
        <span className="mt-3 block space-y-1.5">
          <span className="block h-2 w-full rounded-full bg-track" />
          <span className="block h-2 w-4/5 rounded-full bg-track" />
          <span className="block h-2 w-3/5 rounded-full bg-track" />
        </span>
      </StepCard>
      <StepCard className="left-[18%] top-[78px] rotate-2" step="2" title="Your answer" icon={<ChatTextIcon size={20} weight="bold" />} tone="bg-streak-tint text-streak-text">
        <span className="mt-2 block text-small text-fg">“Start a loyalty program.”</span>
      </StepCard>
      <StepCard className="right-0 top-[150px] -rotate-2 border-correct shadow-[0_4px_0_var(--correct-edge)]" step="3" title="Judge score" icon={<ChartBarIcon size={20} weight="bold" />} tone="bg-correct-tint text-correct-text">
        <span className="mt-1 flex items-baseline gap-1">
          <span className="font-display text-h2 font-extrabold tabular-nums text-fg">91</span>
          <span className="text-small font-bold text-fg-muted">/ 99</span>
        </span>
      </StepCard>
    </div>
  );
}

function StepCard({
  className,
  step,
  title,
  icon,
  tone,
  children
}: {
  className: string;
  step: string;
  title: string;
  icon: ReactNode;
  tone: string;
  children: ReactNode;
}) {
  return (
    <span className={`absolute block w-[64%] rounded-[16px] border-[1.5px] border-rule bg-page p-4 shadow-[0_4px_0_var(--rule)] motion-safe:animate-float ${className}`}>
      <span className="flex items-center gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tone}`}>{icon}</span>
        <span>
          <span className="block text-label font-bold text-fg-muted">Step {step}</span>
          <span className="block font-display text-small font-extrabold text-fg">{title}</span>
        </span>
      </span>
      {children}
    </span>
  );
}
