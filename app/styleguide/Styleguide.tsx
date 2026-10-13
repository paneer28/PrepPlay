"use client";

import { ArrowRightIcon, FlagIcon, ListNumbersIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useState, type ReactNode } from "react";
import { AchievementBadge, type AchievementKind } from "@/components/ds/Achievement";
import { AnswerOption, type AnswerState } from "@/components/ds/AnswerOption";
import { Button, type ButtonVariant } from "@/components/ds/Button";
import { Card, Divider } from "@/components/ds/Card";
import { Confetti } from "@/components/ds/Confetti";
import { FeedbackBanner } from "@/components/ds/FeedbackBanner";
import { Checkbox, FieldLabel, Select, TextInput } from "@/components/ds/Field";
import { Illustration, type IllustrationKind } from "@/components/ds/Illustration";
import { NavCell } from "@/components/ds/NavCell";
import { ProgressBar } from "@/components/ds/ProgressBar";
import { SegmentedControl } from "@/components/ds/SegmentedControl";
import { StatTile } from "@/components/ds/StatTile";
import { ActivityStrip, StreakCounter } from "@/components/ds/Streak";
import { AreaTag, Tag } from "@/components/ds/Tag";
import { ThemeToggle } from "@/components/ds/ThemeToggle";
import { KNOWN_AREAS, areaStyle } from "@/lib/area-colors";

/* -------------------------------------------------------------------------- */
/* Tokens                                                                     */
/* -------------------------------------------------------------------------- */

const COLOR_GROUPS: Array<{ title: string; note?: string; tokens: string[] }> = [
  { title: "Text and surfaces", tokens: ["fg", "fg-muted", "page", "surface", "rule", "rule-strong", "track"] },
  { title: "Brand: actions", tokens: ["brand", "brand-edge", "brand-tint", "brand-text"] },
  { title: "Correct", tokens: ["correct", "correct-edge", "correct-tint", "correct-text", "correct-fill"] },
  { title: "Wrong", tokens: ["wrong", "wrong-edge", "wrong-tint", "wrong-text", "wrong-fill"] },
  { title: "Streak and achievements", tokens: ["streak", "streak-edge", "streak-tint", "streak-text"] },
  { title: "States", tokens: ["disabled", "disabled-fg", "focus"] }
];

// Text/background pairs the UI actually uses. Large bold text only needs 3:1.
const CONTRAST_PAIRS: Array<{ fg: string; bg: string; use: string; min: number }> = [
  { fg: "fg", bg: "page", use: "Body text", min: 4.5 },
  { fg: "fg", bg: "surface", use: "Body text on Surface", min: 4.5 },
  { fg: "fg-muted", bg: "page", use: "Secondary text", min: 4.5 },
  { fg: "fg-muted", bg: "surface", use: "Secondary text on Surface", min: 4.5 },
  { fg: "#ffffff", bg: "brand", use: "Primary button", min: 4.5 },
  { fg: "#ffffff", bg: "correct-fill", use: "Success button", min: 4.5 },
  { fg: "#ffffff", bg: "wrong-fill", use: "Danger button", min: 4.5 },
  { fg: "#1d2130", bg: "streak", use: "Streak button / flagged cell", min: 4.5 },
  { fg: "brand-text", bg: "page", use: "Links, ghost button", min: 4.5 },
  { fg: "brand-text", bg: "brand-tint", use: "Brand tag", min: 4.5 },
  { fg: "correct-text", bg: "page", use: "Correct text", min: 4.5 },
  { fg: "correct-text", bg: "correct-tint", use: "Correct banner, tag", min: 4.5 },
  { fg: "wrong-text", bg: "page", use: "Wrong text", min: 4.5 },
  { fg: "wrong-text", bg: "wrong-tint", use: "Wrong banner, tag", min: 4.5 },
  { fg: "streak-text", bg: "page", use: "Streak text", min: 4.5 },
  { fg: "streak-text", bg: "streak-tint", use: "Streak counter, tag", min: 4.5 },
  { fg: "fg", bg: "brand-tint", use: "Selected answer text", min: 4.5 },
  { fg: "fg", bg: "correct-tint", use: "Explanation on correct banner", min: 4.5 },
  { fg: "fg", bg: "wrong-tint", use: "Explanation on wrong banner", min: 4.5 },
  { fg: "focus", bg: "page", use: "Focus ring (non-text, 3:1)", min: 3 },
  { fg: "disabled-fg", bg: "disabled", use: "Disabled button (exempt; aim 3:1)", min: 3 }
];

const cssValue = (token: string) => (token.startsWith("#") ? token : `var(--${token})`);

// Resolve any CSS colour (including var() and oklch) to sRGB via a 1px canvas.
function resolveRgb(color: string, probe: HTMLElement, context: CanvasRenderingContext2D) {
  probe.style.color = color;
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = getComputedStyle(probe).color;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return [r, g, b] as const;
}

function luminance([r, g, b]: readonly number[]) {
  const channel = (value: number) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: readonly number[], b: readonly number[]) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

const hex = (rgb: readonly number[]) => `#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")}`;

// Recomputes whenever the theme changes so both sets are checked live.
function useResolvedColors(tokens: string[]) {
  const [values, setValues] = useState<Record<string, readonly number[]>>({});

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const probe = document.createElement("span");
    document.body.appendChild(probe);

    const measure = () => {
      if (!context) return;
      setValues(Object.fromEntries(tokens.map((token) => [token, resolveRgb(cssValue(token), probe, context)])));
    };

    measure();
    const observer = new MutationObserver(measure);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", measure);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", measure);
      probe.remove();
    };
    // tokens is a module constant
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return values;
}

const ALL_TOKENS = Array.from(
  new Set([...COLOR_GROUPS.flatMap((group) => group.tokens), ...CONTRAST_PAIRS.flatMap((pair) => [pair.fg, pair.bg])])
);

/* -------------------------------------------------------------------------- */
/* Layout helpers                                                             */
/* -------------------------------------------------------------------------- */

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-6 border-t-[1.5px] border-rule pt-12 first:border-t-0 first:pt-0">
      <div className="max-w-2xl space-y-2">
        <h2 className="font-display text-h2 text-fg">{title}</h2>
        {description ? <p className="text-fg">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-3 md:grid-cols-[160px_1fr] md:items-center">
      <p className="text-label font-bold text-fg-muted">{label}</p>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </div>
  );
}

const NAV = [
  ["colour", "Colour"],
  ["contrast", "Contrast"],
  ["areas", "Area colours"],
  ["type", "Typography"],
  ["shape", "Shape and spacing"],
  ["buttons", "Buttons"],
  ["answers", "Answer options"],
  ["feedback", "Feedback banner"],
  ["progress", "Progress bar"],
  ["cards", "Cards"],
  ["tags", "Tags"],
  ["segmented", "Segmented control"],
  ["fields", "Fields"],
  ["stats", "Stat tiles"],
  ["streak", "Streak and badges"],
  ["navigator", "Question navigator"],
  ["illustrations", "Illustrations"],
  ["motion", "Motion"]
] as const;

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export function Styleguide() {
  const colors = useResolvedColors(ALL_TOKENS);

  return (
    <div className="pt-2">
      <div className="mx-auto max-w-[1100px]">
        <header className="flex flex-wrap items-end justify-between gap-6 pb-10">
          <div className="max-w-2xl space-y-3">
            <h1 className="font-display text-h1 text-fg">PrepPlay design system</h1>
            <p className="text-fg">
              Every token and component in every state. Switch the theme to check the dark set; contrast ratios below are
              measured live from the current theme.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <nav aria-label="Styleguide sections" className="mb-12 flex flex-wrap gap-x-5 gap-y-2 text-small font-bold">
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="text-brand-text hover:underline">
              {label}
            </a>
          ))}
        </nav>

        <div className="space-y-12">
          <Section id="colour" title="Colour" description="Brand for actions, green for correct, red for wrong, amber for streaks. Nothing is colourful just to decorate. No gradients.">
            <div className="space-y-8">
              {COLOR_GROUPS.map((group) => (
                <div key={group.title} className="space-y-3">
                  <h3 className="font-display text-h4 text-fg">{group.title}</h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    {group.tokens.map((token) => (
                      <div key={token}>
                        <div className="h-16 rounded-control border-[1.5px] border-rule" style={{ background: `var(--${token})` }} />
                        <p className="mt-2 text-small font-extrabold text-fg">{token}</p>
                        <p className="font-mono text-label text-fg-muted">{colors[token] ? hex(colors[token]) : "…"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="contrast" title="Contrast" description="WCAG AA: 4.5:1 for text, 3:1 for the focus ring. Measured from the live theme.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-small">
                <thead>
                  <tr className="border-b-[1.5px] border-rule text-label font-bold text-fg-muted">
                    <th className="py-2 pr-4 font-bold">Sample</th>
                    <th className="py-2 pr-4 font-bold">Used for</th>
                    <th className="py-2 pr-4 font-bold">Pair</th>
                    <th className="py-2 text-right font-bold">Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {CONTRAST_PAIRS.map((pair) => {
                    const a = colors[pair.fg];
                    const b = colors[pair.bg];
                    const ratio = a && b ? contrast(a, b) : null;
                    const pass = ratio !== null && ratio >= pair.min;
                    return (
                      <tr key={`${pair.fg}-${pair.bg}`} className="border-b-[1.5px] border-rule last:border-0">
                        <td className="py-2.5 pr-4">
                          <span
                            className="inline-flex h-9 min-w-16 items-center justify-center rounded-lg px-3 font-extrabold"
                            style={{ color: cssValue(pair.fg), background: cssValue(pair.bg), outline: pair.bg === "page" ? "1.5px solid var(--rule)" : undefined }}
                          >
                            Aa
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 font-semibold text-fg">{pair.use}</td>
                        <td className="py-2.5 pr-4 font-mono text-label text-fg-muted">
                          {pair.fg} / {pair.bg}
                        </td>
                        <td className="py-2.5 text-right">
                          {ratio === null ? (
                            "…"
                          ) : (
                            <span className="inline-flex items-center gap-2 font-extrabold tabular-nums text-fg">
                              {ratio.toFixed(2)}
                              <Tag tone={pass ? "correct" : "wrong"}>{pass ? "Pass" : "Fail"}</Tag>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="areas" title="Area colours" description="Softer hues for the 25 instructional areas, for charts and tags only, never buttons.">
            <div className="flex flex-wrap gap-2">
              {KNOWN_AREAS.map((area) => (
                <AreaTag key={area} area={area} />
              ))}
            </div>
            <div className="space-y-2.5">
              {KNOWN_AREAS.slice(0, 8).map((area, index) => (
                <div key={area} className="grid grid-cols-[minmax(0,180px)_1fr] items-center gap-4">
                  <span className="truncate text-small font-bold text-fg">{area}</span>
                  <span className="h-3 overflow-hidden rounded-full bg-track">
                    <span className="area-fill block h-full rounded-full" style={{ ...areaStyle(area), width: `${92 - index * 9}%` }} />
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <Section id="type" title="Typography" description="Bricolage Grotesque for headings, Nunito for everything else. Sentence case, no all-caps labels.">
            <div className="space-y-5">
              {(
                [
                  ["h1", "40 · Bricolage 800", "font-display text-h1 font-extrabold", "Take a full cluster exam"],
                  ["h2", "32 · Bricolage 800", "font-display text-h2 font-extrabold", "Success rate by area"],
                  ["h3", "24 · Bricolage 700", "font-display text-h3 font-bold", "Your weakest areas"],
                  ["h4", "20 · Bricolage 700", "font-display text-h4 font-bold", "Marketing Cluster Exam"],
                  ["Question", "22 · Nunito 700", "font-body text-[22px] font-bold leading-snug", "Which of the following is an example of a business's intangible asset?"],
                  ["Body", "17 · Nunito 500", "text-body", "Answers and explanations stay hidden until you submit. Then you get a breakdown by instructional area."],
                  ["Small", "15 · Nunito 600", "text-small font-semibold", "100 questions · 90 minutes"],
                  ["Label", "13 · Nunito 700, muted", "text-label font-bold text-fg-muted", "Instructional area"],
                  ["Numbers", "Tabular figures", "font-display text-h2 font-extrabold tabular-nums", "86% · 1:24:07 · 72 / 100"]
                ] as const
              ).map(([name, spec, className, sample]) => (
                <div key={name} className="grid gap-1 md:grid-cols-[160px_1fr] md:items-baseline md:gap-6">
                  <div>
                    <p className="text-small font-extrabold text-fg">{name}</p>
                    <p className="text-label font-semibold text-fg-muted">{spec}</p>
                  </div>
                  <p className={`text-fg ${className}`}>{sample}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="shape" title="Shape and spacing" description="12px for controls, 16px for cards, fully round only for tags and the streak. 4px spacing grid.">
            <div className="flex flex-wrap items-end gap-6">
              {[
                ["12px", "Buttons, options", "rounded-control"],
                ["16px", "Cards, panels", "rounded-card"],
                ["999px", "Tags, streak", "rounded-full"]
              ].map(([value, use, className]) => (
                <div key={value} className="space-y-2">
                  <div className={`h-20 w-28 border-[1.5px] border-rule bg-surface ${className}`} />
                  <p className="text-small font-extrabold text-fg">{value}</p>
                  <p className="text-label font-semibold text-fg-muted">{use}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-3">
              {[4, 8, 12, 16, 24, 32, 48, 64].map((size) => (
                <div key={size} className="flex flex-col items-center gap-1.5">
                  <span className="block rounded-sm bg-brand" style={{ width: size, height: size }} />
                  <span className="text-label font-bold tabular-nums text-fg-muted">{size}</span>
                </div>
              ))}
            </div>
          </Section>

          <ButtonsSection />
          <AnswersSection />
          <FeedbackSection />
          <ProgressSection />

          <Section id="cards" title="Cards" description="One level only: a 1.5px border, 16px radius, 24px padding. Inside, group with spacing or a divider, never another bordered card.">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <h3 className="font-display text-h4 text-fg">Marketing Cluster Exam</h3>
                <p className="mt-1 text-small font-semibold text-fg-muted">100 questions · 90 minutes</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Tag tone="brand">Marketing</Tag>
                  <Tag>2025</Tag>
                  <Tag>ICDC</Tag>
                </div>
                <Divider className="my-5" />
                <div className="flex items-center justify-between gap-4">
                  <span className="text-small font-bold text-fg-muted">Last score 86%</span>
                  <Button size="sm" variant="secondary">
                    View results
                  </Button>
                </div>
              </Card>
              <Card className="bg-surface">
                <h3 className="font-display text-h4 text-fg">On a Surface background</h3>
                <p className="mt-2 text-fg">
                  Use Surface for a calm section that needs separating from the page. Text stays Ink, not grey.
                </p>
              </Card>
            </div>
          </Section>

          <Section id="tags" title="Tags" description="13px bold, tint background with matching darker text. Only for real labels.">
            <Row label="Tones">
              <Tag>Neutral</Tag>
              <Tag tone="brand">Marketing</Tag>
              <Tag tone="correct">Completed</Tag>
              <Tag tone="wrong">Missed</Tag>
              <Tag tone="streak">In progress</Tag>
            </Row>
            <Row label="Level and year">
              <Tag>District</Tag>
              <Tag>State</Tag>
              <Tag>ICDC</Tag>
              <Tag>2025</Tag>
            </Row>
          </Section>

          <SegmentedSection />

          <Section id="fields" title="Fields" description="Dropdowns, text inputs and checkboxes in the same 12px, 1.5px-border language.">
            <div className="grid max-w-3xl gap-4 sm:grid-cols-3">
              <FieldLabel label="Cluster">
                <Select defaultValue="">
                  <option value="">All clusters</option>
                  <option>Marketing</option>
                  <option>Finance</option>
                </Select>
              </FieldLabel>
              <FieldLabel label="Level">
                <Select defaultValue="ICDC">
                  <option>District</option>
                  <option>State</option>
                  <option>ICDC</option>
                </Select>
              </FieldLabel>
              <FieldLabel label="Search">
                <TextInput placeholder="Search questions" />
              </FieldLabel>
            </div>
            <div className="flex flex-wrap gap-6">
              <Checkbox label="Business Law" defaultChecked />
              <Checkbox label="Economics" />
              <Checkbox label="Disabled" disabled />
            </div>
          </Section>

          <Section id="stats" title="Stat tiles" description="Big Bricolage number, a short sentence-case label, optional trend.">
            <div className="grid gap-8 sm:grid-cols-3">
              <StatTile value="86%" label="Average score" trend={{ direction: "up", text: "4 pts vs last week" }} />
              <StatTile value="1:12:40" label="Time on last test" />
              <StatTile value="23" label="Tests completed" trend={{ direction: "down", text: "2 fewer than last week", good: false }} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatTile boxed value="86%" label="Score" />
              <StatTile boxed value="58m" label="Time" />
              <StatTile boxed value="Pricing" label="Best area" />
            </div>
          </Section>

          <StreakSection />
          <NavigatorSection />

          <Section id="illustrations" title="Illustrations and icons" description="Flat geometric shapes in the palette for empty states and results. Icons: Phosphor, bold weight, rounded ends.">
            <div className="flex flex-wrap gap-8">
              {(["trophy", "target", "chart", "empty"] as IllustrationKind[]).map((kind) => (
                <figure key={kind} className="flex flex-col items-center gap-2">
                  <Illustration kind={kind} size={140} />
                  <figcaption className="text-label font-bold capitalize text-fg-muted">{kind}</figcaption>
                </figure>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-5 text-fg">
              <XIcon size={24} weight="bold" aria-label="Close" />
              <FlagIcon size={24} weight="bold" aria-label="Flag" />
              <ListNumbersIcon size={24} weight="bold" aria-label="Questions" />
              <ArrowRightIcon size={24} weight="bold" aria-label="Next" />
            </div>
          </Section>

          <MotionSection />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Interactive sections                                                        */
/* -------------------------------------------------------------------------- */

const VARIANTS: ButtonVariant[] = ["primary", "success", "danger", "secondary", "ghost", "streak"];

function ButtonsSection() {
  return (
    <Section id="buttons" title="Buttons" description="Solid fill with a 4px edge underneath. Pressing moves the button down 4px and removes the edge. Disabled is flat grey.">
      <div className="space-y-5">
        {VARIANTS.map((variant) => (
          <Row key={variant} label={variant[0].toUpperCase() + variant.slice(1)}>
            <Button variant={variant}>Default</Button>
            <Button variant={variant} data-force="hover">
              Hover
            </Button>
            <Button variant={variant} data-force="active">
              Pressed
            </Button>
            <Button variant={variant} data-force="focus">
              Focus
            </Button>
            <Button variant={variant} disabled>
              Disabled
            </Button>
          </Row>
        ))}
        <Row label="Sizes">
          <Button size="lg">Main action · 52px</Button>
          <Button>Default · 44px</Button>
          <Button size="sm">Small · 36px</Button>
        </Row>
        <Row label="With icon">
          <Button size="lg" iconRight={<ArrowRightIcon size={20} weight="bold" aria-hidden="true" />}>
            Next
          </Button>
          <Button variant="secondary" icon={<ListNumbersIcon size={18} weight="bold" aria-hidden="true" />}>
            Questions
          </Button>
          <Button variant="ghost">Skip</Button>
        </Row>
      </div>
    </Section>
  );
}

const OPTIONS = [
  ["A", "A patent the company holds on a new process"],
  ["B", "The delivery trucks the company owns"],
  ["C", "Cash held in the company's checking account"],
  ["D", "An office building the company leases"]
] as const;

function AnswersSection() {
  const [selected, setSelected] = useState<string | null>(null);

  const states: Array<[string, (letter: string) => AnswerState]> = [
    ["Idle", () => "idle"],
    ["Selected (B)", (letter) => (letter === "B" ? "selected" : "idle")],
    ["Reviewed: wrong pick", (letter) => (letter === "A" ? "correct" : letter === "B" ? "wrong" : "dimmed")],
    ["Reviewed: right pick", (letter) => (letter === "A" ? "correct" : "dimmed")]
  ];

  return (
    <Section id="answers" title="Answer options" description="Letter badge on the left, keyboard key on the right (desktop). Hover darkens the border; selected uses the brand; review shows green, red and faded.">
      <div className="space-y-3">
        <p className="text-label font-bold text-fg-muted">Try it</p>
        <div className="max-w-[720px] space-y-3">
          {OPTIONS.map(([letter, text], index) => (
            <AnswerOption
              key={letter}
              letter={letter}
              shortcut={String(index + 1)}
              state={selected === letter ? "selected" : "idle"}
              onClick={() => setSelected((value) => (value === letter ? null : letter))}
            >
              {text}
            </AnswerOption>
          ))}
        </div>
      </div>
      <div className="grid gap-10 lg:grid-cols-2">
        {states.map(([label, stateFor]) => (
          <div key={label} className="space-y-3">
            <p className="text-label font-bold text-fg-muted">{label}</p>
            <div className="space-y-3">
              {OPTIONS.map(([letter, text], index) => {
                const state = stateFor(letter);
                return (
                  <AnswerOption
                    key={letter}
                    letter={letter}
                    shortcut={String(index + 1)}
                    state={state}
                    disabled={label.startsWith("Reviewed")}
                    data-force={label === "Idle" && letter === "C" ? "hover" : undefined}
                  >
                    {text}
                  </AnswerOption>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function FeedbackSection() {
  const [shown, setShown] = useState<"correct" | "wrong" | null>(null);
  const [replay, setReplay] = useState(0);
  const show = (tone: "correct" | "wrong") => {
    setShown(tone);
    setReplay((value) => value + 1);
  };

  return (
    <Section id="feedback" title="Feedback banner" description="Slides up under the question in Check mode and in the results review. The Continue button matches the result.">
      <div className="max-w-[720px] space-y-4">
        <FeedbackBanner tone="correct" explanation="A patent is an intangible asset: it has value but no physical form." onContinue={() => undefined} />
        <FeedbackBanner
          tone="wrong"
          correctAnswer="A. A patent the company holds on a new process"
          explanation="Trucks are tangible, physical assets. A patent has value but no physical form, which makes it intangible."
          onContinue={() => undefined}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setShown(null)}>
          Reset
        </Button>
        <Button variant="success" onClick={() => show("correct")}>
          Replay correct
        </Button>
        <Button variant="danger" onClick={() => show("wrong")}>
          Replay wrong
        </Button>
      </div>
      {shown ? (
        <div className="max-w-[720px] overflow-hidden">
          <FeedbackBanner
            key={replay}
            tone={shown}
            correctAnswer="A. A patent the company holds on a new process"
            explanation="Watch it slide up from the bottom of the question area."
            onContinue={() => setShown(null)}
          />
        </div>
      ) : null}
    </Section>
  );
}

function ProgressSection() {
  const [answered, setAnswered] = useState(37);

  return (
    <Section id="progress" title="Progress bar" description="16px, fully rounded, with a glossy highlight along the top third. The fill animates on each answer.">
      <div className="max-w-[720px] space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-small font-bold text-fg">
            <span>Question {Math.min(answered + 1, 100)} of 100</span>
            <span className="tabular-nums text-fg-muted">{answered} answered</span>
          </div>
          <ProgressBar value={answered / 100} label="Test progress" />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="sm" onClick={() => setAnswered((value) => Math.min(100, value + 1))}>
            Answer one
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setAnswered((value) => Math.min(100, value + 10))}>
            +10
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAnswered(0)}>
            Reset
          </Button>
        </div>
        <Row label="States">
          <div className="grid w-full gap-3">
            <ProgressBar value={0} label="Empty" />
            <ProgressBar value={0.04} label="Just started" />
            <ProgressBar value={0.72} label="Correct tone" tone="correct" />
            <ProgressBar value={1} label="Full" />
          </div>
        </Row>
      </div>
    </Section>
  );
}

function SegmentedSection() {
  const [mode, setMode] = useState<"full" | "custom">("full");
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  return (
    <Section id="segmented" title="Segmented control" description="A Surface track with the selected segment as a raised white tile. Used for the mode switch, tabs and time ranges.">
      <Row label="Mode switch">
        <SegmentedControl
          label="Practice mode"
          value={mode}
          onChange={setMode}
          items={[
            { value: "full", label: "Full test" },
            { value: "custom", label: "Custom practice" }
          ]}
        />
      </Row>
      <Row label="Time range (small)">
        <SegmentedControl
          label="Time range"
          size="sm"
          value={range}
          onChange={setRange}
          items={[
            { value: "7d", label: "7 days" },
            { value: "30d", label: "30 days" },
            { value: "90d", label: "90 days" },
            { value: "all", label: "All time" }
          ]}
        />
      </Row>
      <Row label="Full width (mobile)">
        <div className="w-full max-w-sm">
          <SegmentedControl
            label="Practice mode, full width"
            block
            value={mode}
            onChange={setMode}
            items={[
              { value: "full", label: "Full test" },
              { value: "custom", label: "Custom practice" }
            ]}
          />
        </div>
      </Row>
      <Row label="Theme toggle">
        <ThemeToggle />
      </Row>
    </Section>
  );
}

const WEEK = ["M", "T", "W", "T", "F", "S", "S"].map((label, index) => ({
  label,
  date: `2026-10-${String(5 + index).padStart(2, "0")}`,
  active: [true, true, false, true, true, true, false][index],
  today: index === 5
}));

function StreakSection() {
  const kinds: AchievementKind[] = ["first-test", "ten-tests", "high-score", "week-streak"];

  return (
    <Section id="streak" title="Streak and achievements" description="Amber is reserved for streaks and achievements. The streak counts consecutive days with a completed test or roleplay.">
      <Row label="Streak counter">
        <StreakCounter days={12} />
        <StreakCounter days={1} />
        <StreakCounter days={0} />
      </Row>
      <Row label="Weekly activity">
        <ActivityStrip days={WEEK} />
      </Row>
      <Row label="Badges: earned">
        {kinds.map((kind) => (
          <AchievementBadge key={kind} kind={kind} earned />
        ))}
      </Row>
      <Row label="Badges: locked">
        {kinds.map((kind) => (
          <AchievementBadge key={kind} kind={kind} earned={false} />
        ))}
      </Row>
    </Section>
  );
}

function NavigatorSection() {
  const answered = new Set([1, 2, 3, 4, 6, 7, 9, 10, 11, 14]);
  const flagged = new Set([5, 9]);

  return (
    <Section id="navigator" title="Question navigator" description="Compact grid in the slide-out Questions panel. Answered is brand, flagged is amber, the current question is outlined.">
      <div className="flex max-w-md flex-wrap gap-2">
        {Array.from({ length: 20 }, (_, index) => index + 1).map((number) => (
          <NavCell key={number} number={number} answered={answered.has(number)} flagged={flagged.has(number)} current={number === 12} />
        ))}
      </div>
      <div className="flex flex-wrap gap-5 text-label font-bold text-fg-muted">
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-brand" /> Answered
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-streak" /> Flagged
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 rounded border-[1.5px] border-rule" /> Not answered
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 rounded outline outline-2 outline-offset-1 outline-fg" /> Current
        </span>
      </div>
    </Section>
  );
}

function MotionSection() {
  const [burst, setBurst] = useState(0);
  const [pop, setPop] = useState(0);

  return (
    <Section id="motion" title="Motion" description="Fast and springy, 120–260ms. With reduced motion turned on, movement becomes simple fades and confetti is skipped.">
      <Row label="Correct pop">
        <div className="w-full max-w-md">
          <AnswerOption key={pop} letter="A" state="correct" disabled>
            A patent the company holds on a new process
          </AnswerOption>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setPop((value) => value + 1)}>
          Replay
        </Button>
      </Row>
      <Row label="Confetti (80%+)">
        <Button variant="streak" onClick={() => setBurst((value) => value + 1)}>
          Celebrate
        </Button>
        <Confetti burst={burst} />
      </Row>
    </Section>
  );
}
