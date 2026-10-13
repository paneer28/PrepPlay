import { ArrowRightIcon, ChartBarIcon, ChatTextIcon, CheckIcon, FileTextIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { ButtonLink } from "@/components/ds/Button";
import { FreeNote } from "@/components/home/FreeNote";
import { QuestionPreview, type PreviewQuestion } from "@/components/home/QuestionPreview";
import { FadeIn, HeroFadeIn, ScaleIn, Stagger, StaggerItem } from "@/components/ui/motion-wrappers";
import { scoreColor } from "@/lib/score-scale";
import { getTestById } from "@/lib/tests";

// The first real sentence of an explanation, kept short for the preview card.
// (Explanations often open by repeating the answer, e.g. "Installation.")
function shortExplanation(text: string) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const first = (sentences[0]?.length ?? 0) < 30 && sentences[1] ? sentences[1] : (sentences[0] ?? text);
  return first.length > 150 ? `${first.slice(0, 147).trimEnd()}…` : first;
}

// The hero preview: the mockup's Business Law question, then a few real ones.
function previewQuestions(): PreviewQuestion[] {
  const opening: PreviewQuestion = {
    label: "Business Law · BL:069",
    question: "A competitor publishes false claims about your product, and your sales drop. This is an example of",
    options: { A: "privacy.", B: "defamation.", C: "infringement.", D: "trespassing." },
    answer: "B",
    explanation: "Defamation is making false statements that hurt another party's reputation."
  };
  const test = getTestById("bma-cluster-2010-icdc");
  const more = [12, 58, 3, 47]
    .map((number) => test?.questions.find((item) => item.number === number))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item) => ({
      label: `${item.performanceIndicator.instructionalArea} · ${item.performanceIndicator.code}`,
      question: item.question,
      options: item.options,
      answer: item.answer,
      explanation: shortExplanation(item.explanation)
    }));
  return [opening, ...more];
}

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
          {/* Phones: the note sits above the headline so it never covers it. */}
          <HeroFadeIn delay={0} className="lg:hidden">
            <FreeNote arrow={false} className="inline-flex" />
          </HeroFadeIn>
          <HeroFadeIn delay={0.06} className="relative">
            {/* Desktop: a margin note above the headline, arrow pointing down at it. */}
            <FreeNote arrowSide="right" className="absolute -top-[86px] left-0 z-10 hidden lg:inline-flex" />
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
          <QuestionPreview questions={previewQuestions()} />
        </HeroFadeIn>
      </section>

      {/* Three ways */}
      {/* Full-bleed band: the shadow paints the surface edge to edge, clip-path trims it vertically, so nothing overflows. */}
      <section id="workflow" className="scroll-mt-16 bg-surface py-20 [box-shadow:0_0_0_100vmax_var(--surface)] [clip-path:inset(0_-100vmax)] lg:py-24">
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
      <section id="features" className="scroll-mt-16 grid gap-12 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
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
            href="/tests"
            className="btn btn-lg shrink-0 [--btn-bg:#fff] [--btn-edge:#c9bffd] [--btn-fg:#3f25c9] focus-visible:outline-white"
          >
            Start practicing
          </Link>
        </section>
      </ScaleIn>
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
      </div>
      <Link href="/tests/custom?area=Operations" className="btn mt-6">
        Practice Operations
      </Link>
    </figure>
  );
}
