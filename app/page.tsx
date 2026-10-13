import { ArrowRightIcon, ChartBarIcon, ChatTextIcon, CheckIcon, FileTextIcon, FlameIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import { AnswerOption } from "@/components/ds/AnswerOption";
import { ButtonLink } from "@/components/ds/Button";
import { Tag } from "@/components/ds/Tag";
import { FadeIn, HeroFadeIn, ScaleIn, Stagger, StaggerItem } from "@/components/ui/motion-wrappers";
import { scoreColor } from "@/lib/score-scale";

const ways = [
  {
    title: "Practice tests",
    copy: "Take a full District, State or ICDC exam under real conditions, or build a custom set by instructional area.",
    link: "Browse exams",
    href: "/tests",
    icon: FileTextIcon,
    tone: "bg-brand-tint text-brand-text"
  },
  {
    title: "Roleplays",
    copy: "Get a realistic scenario, give your response, and see how it scores against the performance indicators.",
    link: "Start a roleplay",
    href: "/practice",
    icon: ChatTextIcon,
    tone: "bg-streak-tint text-streak-text"
  },
  {
    title: "Your dashboard",
    copy: "See your success rate for every instructional area and which ones are costing you the most points.",
    link: "See your progress",
    href: "/account?tab=tests",
    icon: ChartBarIcon,
    tone: "bg-correct-tint text-correct-text"
  }
];

const focusAreas = [
  { area: "Operations", percent: 68, lost: "−8 pts" },
  { area: "Economics", percent: 74, lost: "−4 pts" },
  { area: "Marketing", percent: 81, lost: "−3 pts" },
  { area: "Business Law", percent: 92, lost: "−1 pt" }
];

const benefits = ["Full explanation for every question", "Notes on the questions you miss", "Compare every exam you've taken side by side"];

const week = [true, true, false, true, true, true, false];

export default function HomePage() {
  return (
    <div id="top" className="-mb-20">
      {/* Hero */}
      <section className="grid gap-14 pb-20 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:items-center lg:gap-10 lg:pb-28 lg:pt-14">
        <div className="space-y-7">
          <HeroFadeIn delay={0}>
            <Tag tone="brand">For DECA competitors</Tag>
          </HeroFadeIn>
          <HeroFadeIn delay={0.06}>
            <h1 className="max-w-[17ch] font-display text-[46px] font-extrabold leading-[0.98] tracking-[-0.035em] text-fg sm:text-[60px] xl:text-[66px]">
              Practice DECA like it&apos;s game day.
            </h1>
          </HeroFadeIn>
          <HeroFadeIn delay={0.12}>
            <p className="max-w-xl text-[19px] leading-relaxed text-fg">
              Real cluster exams with every answer explained, roleplays scored against performance indicators, and a dashboard that
              shows exactly where you lose points.
            </p>
          </HeroFadeIn>
          <HeroFadeIn delay={0.18}>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/practice" size="lg">
                Start practicing
              </ButtonLink>
              <ButtonLink href="/tests" size="lg" variant="secondary">
                Take a full exam
              </ButtonLink>
            </div>
          </HeroFadeIn>
          <HeroFadeIn delay={0.24}>
            <p className="text-small text-fg-muted">District, State and ICDC exams · Business Management, Marketing, and more</p>
          </HeroFadeIn>
        </div>

        <HeroFadeIn delay={0.14}>
          <QuestionPreview />
        </HeroFadeIn>
      </section>

      {/* Three ways */}
      {/* Full-bleed band: the shadow paints the surface edge to edge, clip-path trims it vertically, so nothing overflows. */}
      <section className="bg-surface py-20 [box-shadow:0_0_0_100vmax_var(--surface)] [clip-path:inset(0_-100vmax)] lg:py-24">
        <FadeIn>
          <h2 className="font-display text-h2 font-extrabold text-fg sm:text-[44px] sm:leading-tight">Three ways to get ready</h2>
          <p className="mt-2 text-fg">Pick what you need today. Everything you do feeds the same dashboard.</p>
        </FadeIn>
        <Stagger className="mt-10 grid gap-4 md:grid-cols-3">
          {ways.map((way) => (
            <StaggerItem key={way.title} className="h-full">
              <Link
                href={way.href}
                className="group flex h-full flex-col rounded-card border-[1.5px] border-rule bg-page p-7 shadow-[0_4px_0_var(--rule)] transition-transform hover:-translate-y-0.5"
              >
                <span className={`grid h-14 w-14 place-items-center rounded-control ${way.tone}`}>
                  <way.icon size={26} weight="bold" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-h3 font-extrabold text-fg">{way.title}</h3>
                <p className="mt-2 flex-1 text-fg">{way.copy}</p>
                <span className="mt-5 inline-flex items-center gap-1 font-extrabold text-brand-text">
                  {way.link}
                  <ArrowRightIcon size={16} weight="bold" aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Know what to study */}
      <section className="grid gap-12 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
        <FadeIn className="space-y-5">
          <h2 className="max-w-[14ch] font-display text-h2 font-extrabold text-fg sm:text-[44px] sm:leading-tight">Know exactly what to study next</h2>
          <p className="max-w-xl text-fg">
            Every answer is tagged with its performance indicator, so your dashboard can rank your weakest areas by points lost and turn
            them into a practice set in one tap.
          </p>
          <ul className="space-y-3">
            {benefits.map((item) => (
              <li key={item} className="flex items-center gap-3 font-bold text-fg">
                <CheckIcon size={20} weight="bold" aria-hidden="true" className="shrink-0 text-correct" />
                {item}
              </li>
            ))}
          </ul>
        </FadeIn>
        <FadeIn>
          <DashboardPreview />
        </FadeIn>
      </section>

      {/* Call to action */}
      <ScaleIn className="pb-24">
        <section className="flex flex-col gap-8 rounded-[24px] bg-brand px-7 py-12 text-white shadow-[0_6px_0_var(--brand-edge)] sm:px-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h2 className="font-display text-h2 font-extrabold leading-tight sm:text-[40px]">Your next competition starts with one question.</h2>
            <p className="font-semibold text-white/90">Ten minutes a day adds up. Keep your streak going.</p>
          </div>
          <Link
            href="/practice"
            className="btn btn-lg shrink-0 [--btn-bg:#fff] [--btn-edge:#c9bffd] [--btn-fg:#3f25c9] focus-visible:outline-white"
          >
            Start practicing
          </Link>
        </section>
      </ScaleIn>
    </div>
  );
}

// A live-looking question, built from the real answer-option and feedback styles.
function QuestionPreview() {
  return (
    <figure className="relative mx-auto max-w-[560px] px-2 pt-6 sm:px-6" aria-label="Preview of a practice question answered correctly">
      <div className="overflow-hidden rounded-[20px] border-[1.5px] border-rule bg-page shadow-[0_6px_0_var(--rule)]" aria-hidden="true">
        <div className="space-y-4 p-5 sm:p-7">
          <div className="flex items-center gap-4">
            <XIcon size={20} weight="bold" className="shrink-0 text-fg-muted" />
            <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-track">
              <div className="relative h-full w-[34%] rounded-full bg-brand">
                <span className="absolute inset-x-2 top-[3px] h-[3px] rounded-full bg-white/35" />
              </div>
            </div>
            <span className="text-small font-extrabold tabular-nums text-fg">34/100</span>
          </div>
          <p className="text-label font-bold text-fg-muted">Business Law · BL:069</p>
          <p className="font-body text-[19px] font-bold leading-snug text-fg sm:text-[21px]">
            A competitor publishes false claims about your product, and your sales drop. This is an example of
          </p>
          <div className="space-y-2.5">
            <AnswerOption letter="A" state="dimmed" readOnly>
              privacy.
            </AnswerOption>
            <AnswerOption letter="B" state="correct" readOnly>
              defamation.
            </AnswerOption>
            <AnswerOption letter="C" state="dimmed" readOnly>
              infringement.
            </AnswerOption>
            <AnswerOption letter="D" state="dimmed" readOnly>
              trespassing.
            </AnswerOption>
          </div>
        </div>
        <div className="flex flex-col gap-3 bg-correct-tint px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            <p className="font-display text-h4 font-extrabold text-correct-text">Correct!</p>
            <p className="text-small text-fg">Defamation is making false statements that hurt another party&apos;s reputation.</p>
          </div>
          <span className="btn btn-success shrink-0">Continue</span>
        </div>
      </div>

      <FloatingCard className="-right-1 top-0 rotate-[4deg] border-streak shadow-[0_4px_0_var(--streak-edge)] sm:-right-3">
        <span className="flex items-center gap-2 px-1 font-display text-small font-extrabold text-fg">
          <FlameIcon size={20} weight="fill" className="text-streak" />
          12-day streak
        </span>
      </FloatingCard>

      <FloatingCard className="-left-1 bottom-[150px] w-[200px] -rotate-[4deg] shadow-[0_4px_0_var(--brand-tint)] sm:-left-8">
        <span className="block px-1 text-label font-extrabold text-fg">Economics</span>
        <span className="mt-1.5 flex items-center gap-2 px-1">
          <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-track">
            <span className="block h-full w-[92%] rounded-full bg-correct" />
          </span>
          <span className="text-label font-extrabold tabular-nums text-fg">92%</span>
        </span>
      </FloatingCard>
    </figure>
  );
}

function FloatingCard({ className, children }: { className: string; children: ReactNode }) {
  return (
    <div aria-hidden="true" className={`absolute rounded-[14px] border-[1.5px] border-rule bg-page px-3 py-2.5 motion-safe:animate-float ${className}`}>
      {children}
    </div>
  );
}

function DashboardPreview() {
  return (
    <figure className="card shadow-[0_6px_0_var(--rule)] sm:p-8" aria-label="Preview of the dashboard's focus areas">
      <div aria-hidden="true">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-label font-bold text-fg-muted">This week</p>
            <p className="font-display text-h1 font-extrabold tabular-nums text-fg">84%</p>
            <p className="text-label font-bold text-fg-muted">success rate · 312 questions</p>
          </div>
          <div className="flex gap-1.5">
            {week.map((active, index) => (
              <span
                key={index}
                className={`h-7 w-7 rounded-lg ${active ? "bg-streak shadow-[0_2px_0_var(--streak-edge)]" : "bg-track"}`}
              />
            ))}
          </div>
        </div>
        <hr className="divider my-5" />
        <p className="font-display text-h4 font-extrabold text-fg">Focus areas</p>
        <p className="text-label font-bold text-fg-muted">Ranked by points lost</p>
        <ul className="mt-4 space-y-4">
          {focusAreas.map((row) => (
            <li key={row.area} className="grid grid-cols-[minmax(0,110px)_1fr_auto] items-center gap-3 sm:grid-cols-[130px_1fr_auto]">
              <span className="truncate text-small font-extrabold text-fg">{row.area}</span>
              <span className="h-3 overflow-hidden rounded-full bg-track">
                <span className="block h-full rounded-full" style={{ width: `${row.percent}%`, background: scoreColor(row.percent) }} />
              </span>
              <span className="w-[86px] text-right text-small font-extrabold tabular-nums text-fg">
                {row.percent}% <span className="text-label font-bold text-fg-muted">{row.lost}</span>
              </span>
            </li>
          ))}
        </ul>
        <span className="btn mt-6">Practice Operations</span>
      </div>
    </figure>
  );
}
