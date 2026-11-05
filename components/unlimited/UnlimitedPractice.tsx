"use client";

import { CaretDownIcon, XIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AnswerOption, type AnswerState } from "@/components/ds/AnswerOption";
import { Button, ButtonLink } from "@/components/ds/Button";
import { FeedbackBanner } from "@/components/ds/FeedbackBanner";
import { ClusterIcon } from "@/components/ds/ClusterIcon";
import { FlagButton } from "@/components/FlagButton";
import { LoadingState } from "@/components/LoadingState";
import { TestDialog } from "@/components/TestDialog";
import { TestModeSwitch } from "@/components/TestModeSwitch";
import { HeroFadeIn } from "@/components/ui/motion-wrappers";
import type { UnlimitedCluster } from "@/components/unlimited/UnlimitedPage";
import { SET_ROUTES, type QuestionSet } from "@/lib/question-sets";
import {
  appendLocalReviewEvent,
  buildReviewCards,
  describeReturn,
  dueCards,
  loadLocalReviewEvents,
  reorderedOptions,
  type ReviewEvent
} from "@/lib/review";
import { questionRef } from "@/lib/test-format";
import { newId } from "@/lib/test-progress";
import type { AttemptUpload, SaveStatus } from "@/lib/test-results-shared";
import { saveFlag, uploadAttempts } from "@/lib/test-sync";
import type { TestOptionKey, TestQuestion } from "@/types";

const OPTION_KEYS: TestOptionKey[] = ["A", "B", "C", "D"];
const BATCH = 10;
// A missed question comes back after this many others (plus up to 2 more)...
const RETRY_GAP = 3;
// ...at most this many times in one session; after that it waits for the next.
const MAX_MISSES_PER_SESSION = 3;
// While reviews are due: this many reviews, then one new question.
const REVIEWS_PER_NEW = 2;
// Time on one question counts up to this much (a phone left on the table doesn't).
const MAX_SECONDS_PER_QUESTION = 10 * 60;

// The running session, kept in localStorage so closing the tab doesn't lose it:
// it's saved to the account on the next visit if it wasn't saved on the way out.
type Session = {
  version: 1;
  id: string;
  set: QuestionSet;
  cluster: string;
  label: string;
  startedAt: string;
  elapsedSeconds: number;
  // Answered questions in order, and the answer given to each.
  refs: string[];
  answers: TestOptionKey[];
  correct: number;
};

function loadSession(key: string): Session | null {
  try {
    const session = JSON.parse(window.localStorage.getItem(key) ?? "null") as Session | null;
    return session?.version === 1 && Array.isArray(session.refs) ? session : null;
  } catch {
    return null;
  }
}

function storeSession(key: string, session: Session | null) {
  try {
    if (session) window.localStorage.setItem(key, JSON.stringify(session));
    else window.localStorage.removeItem(key);
  } catch {
    // Storage unavailable: the session still runs, it just can't survive a closed tab.
  }
}

// Saved like any custom practice session, so it shows on the dashboard.
function toUpload(session: Session): AttemptUpload {
  return {
    id: session.id,
    mode: "custom",
    refs: session.refs,
    filters: { summary: `Infinite · ${session.label}` },
    answers: Object.fromEntries(session.answers.map((key, index) => [String(index + 1), key])),
    startedAt: session.startedAt,
    submittedAt: new Date().toISOString(),
    elapsedSeconds: Math.round(session.elapsedSeconds),
    timedOut: false,
    source: "unlimited"
  };
}

const refOf = (question: TestQuestion) => questionRef(question.origin!.testId, question.origin!.number);

type Finished = {
  answered: number;
  correct: number;
  // Different questions missed this session (they'll come back).
  missed: number;
  status: SaveStatus | "signed-out-local";
  exhausted: boolean;
};

// Where the next question comes from.
type Kind = "new" | "review" | "retry";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

export function UnlimitedPractice({
  set,
  cluster,
  label,
  pool,
  history,
  clusters,
  myCluster,
  signedIn,
  autoStart = false,
  source
}: {
  set: QuestionSet;
  cluster: string;
  label: string;
  pool: string[];
  // Saved answers in this cluster (signed in), oldest first.
  history: ReviewEvent[];
  clusters: UnlimitedCluster[];
  myCluster: string | null;
  signedIn: boolean;
  autoStart?: boolean;
  source?: ReactNode;
}) {
  const storageKey = SET_ROUTES[set].unlimitedKey;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [phase, setPhase] = useState<"start" | "playing" | "done">(autoStart ? "playing" : "start");
  const [finished, setFinished] = useState<Finished | null>(null);
  // A session left open last time (tab closed) is saved now.
  const [recovered, setRecovered] = useState<number | null>(null);
  const [leftover] = useState(() => loadSession(storageKey));
  // Answer history drives which questions come back (lib/review.ts): the
  // account's when signed in, this browser's otherwise, plus this visit's.
  const reviewKey = SET_ROUTES[set].reviewKey;
  const [events, setEvents] = useState<ReviewEvent[]>(() => (signedIn ? history : loadLocalReviewEvents(reviewKey)));
  const addEvent = useCallback(
    (event: ReviewEvent) => {
      setEvents((current) => [...current, event]);
      if (!signedIn) appendLocalReviewEvent(reviewKey, event);
    },
    [reviewKey, signedIn]
  );

  useEffect(() => {
    if (!leftover) return;
    if (leftover.refs.length === 0 || !signedIn) {
      storeSession(storageKey, null);
      return;
    }
    uploadAttempts([toUpload(leftover)]).then(({ saved }) => {
      if (!saved.includes(leftover.id)) return;
      storeSession(storageKey, null);
      setRecovered(leftover.refs.length);
    });
  }, [leftover, signedIn, storageKey]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [phase]);

  if (phase === "playing") {
    return (
      <Player
        set={set}
        cluster={cluster}
        label={label}
        pool={pool}
        events={events}
        onAnswer={addEvent}
        storageKey={storageKey}
        signedIn={signedIn}
        onEnd={(result) => {
          setFinished(result);
          setPhase(result.answered > 0 ? "done" : "start");
        }}
      />
    );
  }

  if (phase === "done" && finished) {
    return <Summary set={set} label={label} finished={finished} signedIn={signedIn} onAgain={() => setPhase("playing")} />;
  }

  // One card and one button: the cluster (your event's already picked), a few
  // numbers, Start. Nothing to read before practicing.
  const inPool = new Set(pool);
  const clusterEvents = events.filter((event) => inPool.has(event.ref));
  const accuracy = clusterEvents.length ? Math.round((clusterEvents.filter((event) => event.correct).length / clusterEvents.length) * 100) : null;
  const toReview = dueCards(buildReviewCards(clusterEvents)).length;
  const stats = [
    { value: pool.length.toLocaleString(), label: "questions" },
    ...(toReview > 0 ? [{ value: toReview.toLocaleString(), label: "to review" }] : []),
    ...(accuracy !== null ? [{ value: `${accuracy}%`, label: "accuracy" }] : [])
  ];

  return (
    <div className="space-y-10 pb-10">
      <TestModeSwitch active="unlimited" set={set} extra={source} />

      {recovered ? (
        <p role="status" className="text-small font-bold text-correct-text">
          Your last session ({recovered} {recovered === 1 ? "question" : "questions"}) was saved to your dashboard.
        </p>
      ) : null}

      {pool.length === 0 ? (
        <p className="text-fg-muted">There are no questions here yet.</p>
      ) : (
        <HeroFadeIn>
          <section
            aria-labelledby="unlimited-title"
            className="rounded-card border-[1.5px] border-rule bg-page p-6 shadow-[0_6px_0_var(--rule)] sm:p-10"
          >
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0 space-y-5">
                <ClusterIcon cluster={cluster} size={64} />
                <div className="space-y-2">
                  <p className="text-small font-bold text-fg-muted">Infinite questions</p>
                  <h1 id="unlimited-title" className="font-display text-h2 font-extrabold leading-tight text-fg [overflow-wrap:anywhere] sm:text-h1">
                    {label}
                  </h1>
                </div>
                <ul className="flex flex-wrap gap-x-8 gap-y-2">
                  {stats.map((stat) => (
                    <li key={stat.label} className="flex items-baseline gap-1.5">
                      <span className="font-display text-h4 font-extrabold tabular-nums text-fg">{stat.value}</span>
                      <span className="text-small font-bold text-fg-muted">{stat.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Button size="lg" onClick={() => setPhase("playing")} className="w-full shrink-0 md:w-auto md:min-w-[220px]">
                Start
              </Button>
            </div>

            {clusters.length > 1 ? (
              <div className="mt-8 border-t-[1.5px] border-rule pt-5">
                <button
                  type="button"
                  aria-expanded={pickerOpen}
                  onClick={() => setPickerOpen((open) => !open)}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-control text-small font-extrabold text-brand-text hover:underline"
                >
                  Practice a different cluster
                  <CaretDownIcon size={14} weight="bold" aria-hidden="true" className={`transition-transform ${pickerOpen ? "rotate-180" : ""}`} />
                </button>
                {pickerOpen ? (
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {clusters
                      .filter((item) => item.cluster !== cluster)
                      .map((item) => (
                        <li key={item.cluster}>
                          <Link
                            href={item.href}
                            replace
                            scroll={false}
                            onClick={() => setPickerOpen(false)}
                            className="flex min-h-14 items-center gap-3 rounded-control border-[1.5px] border-rule px-3 py-2 text-small font-bold text-fg transition-colors hover:border-rule-strong hover:bg-surface"
                          >
                            <ClusterIcon cluster={item.cluster} size={36} />
                            <span className="min-w-0">
                              {item.label}
                              {item.cluster === myCluster ? <span className="block text-label font-semibold text-fg-muted">Your event</span> : null}
                            </span>
                          </Link>
                        </li>
                      ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </section>
        </HeroFadeIn>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Playing: one question at a time, no going back                      */
/* ------------------------------------------------------------------ */

type Plan = {
  // Missed earlier in history and due now, most overdue first.
  due: string[];
  // Never answered, shuffled.
  fresh: string[];
  // Answered before and not due: only once everything else runs out.
  seen: string[];
  // Missed this session: back once `at` questions have been answered.
  retry: Array<{ ref: string; at: number }>;
  misses: Map<string, number>;
  reviewsInARow: number;
  // Questions answered before, in any mode or session.
  answeredBefore: Set<string>;
  // The reshuffled option order each question last had this visit.
  lastOrder: Map<string, TestOptionKey[]>;
};

// `order` is the options as shown, slot by slot. Answers are always kept and saved
// under their original letters, so only the screen depends on it.
type Pick = { ref: string; kind: Kind; order: TestOptionKey[] };

function makePlan(pool: string[], events: ReviewEvent[]): { plan: Plan; first: Pick | null } {
  const cards = buildReviewCards(events);
  const inPool = new Set(pool);
  const due = dueCards(cards)
    .map((card) => card.ref)
    .filter((ref) => inPool.has(ref));
  const dueSet = new Set(due);
  const seen = pool
    .filter((ref) => cards.has(ref) && !dueSet.has(ref))
    .sort((left, right) => cards.get(left)!.lastAt - cards.get(right)!.lastAt);
  const plan: Plan = { due, fresh: shuffle(pool.filter((ref) => !cards.has(ref))), seen, retry: [], misses: new Map(), reviewsInARow: 0, answeredBefore: new Set(cards.keys()), lastOrder: new Map() };
  return { plan, first: pickNext(plan, 0) };
}

function pickNext(plan: Plan, answered: number): Pick | null {
  const next = chooseNext(plan, answered);
  if (!next) return null;
  // The first time a question appears its options are as written; after that they move.
  if (!plan.answeredBefore.has(next.ref)) return { ...next, order: OPTION_KEYS };
  const order = reorderedOptions(plan.lastOrder.get(next.ref));
  plan.lastOrder.set(next.ref, order);
  return { ...next, order };
}

// The next question: a missed one whose turn has come, else (while any are due)
// two reviews for every new question, else new ones, else whatever is left.
function chooseNext(plan: Plan, answered: number): Omit<Pick, "order"> | null {
  const retryIndex = plan.retry.findIndex((item) => item.at <= answered);
  if (retryIndex !== -1) return { ref: plan.retry.splice(retryIndex, 1)[0].ref, kind: "retry" };

  if (plan.due.length > 0 && (plan.reviewsInARow < REVIEWS_PER_NEW || plan.fresh.length === 0)) {
    plan.reviewsInARow += 1;
    return { ref: plan.due.shift()!, kind: "review" };
  }
  if (plan.fresh.length > 0) {
    plan.reviewsInARow = 0;
    return { ref: plan.fresh.shift()!, kind: "new" };
  }
  if (plan.retry.length > 0) {
    plan.retry.sort((left, right) => left.at - right.at);
    return { ref: plan.retry.shift()!.ref, kind: "retry" };
  }
  if (plan.seen.length > 0) return { ref: plan.seen.shift()!, kind: "new" };
  return null;
}

function Player({
  set,
  cluster,
  label,
  pool,
  events,
  onAnswer,
  storageKey,
  signedIn,
  onEnd
}: {
  set: QuestionSet;
  cluster: string;
  label: string;
  pool: string[];
  events: ReviewEvent[];
  onAnswer: (event: ReviewEvent) => void;
  storageKey: string;
  signedIn: boolean;
  onEnd: (result: Finished) => void;
}) {
  const [session, setSession] = useState<Session>(() => ({
    version: 1,
    id: newId(),
    set,
    cluster,
    label,
    startedAt: new Date().toISOString(),
    elapsedSeconds: 0,
    refs: [],
    answers: [],
    correct: 0
  }));
  // A session that couldn't be saved when it ended is retried before this one replaces it.
  const [unsaved] = useState(() => loadSession(storageKey));
  useEffect(() => {
    if (unsaved && unsaved.refs.length > 0 && signedIn) void uploadAttempts([toUpload(unsaved)]);
  }, [signedIn, unsaved]);

  const [start] = useState(() => makePlan(pool, events));
  const plan = useRef(start.plan);
  const [current, setCurrent] = useState<Pick | null>(start.first);
  const [cache, setCache] = useState<Record<string, TestQuestion>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, setPending] = useState<TestOptionKey | null>(null);
  const [chosen, setChosen] = useState<TestOptionKey | null>(null);
  // Shown after checking: when this question comes back.
  const [returnNote, setReturnNote] = useState<string | null>(null);
  // Questions flagged for review on the dashboard (signed-in students only).
  const [flagged, setFlagged] = useState<Set<string>>(() => new Set());
  const [flagError, setFlagError] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [ending, setEnding] = useState(false);
  const [openedAt] = useState(() => Date.now());
  const shownAt = useRef(openedAt);
  const inFlight = useRef(new Set<string>());
  const banner = useRef<HTMLDivElement>(null);

  const question = current ? (cache[current.ref] ?? null) : null;
  const answered = session.refs.length;
  const order = current?.order ?? OPTION_KEYS;

  useEffect(() => {
    if (!signedIn) return;
    fetch("/api/flagged-questions")
      .then((response) => (response.ok ? (response.json() as Promise<{ refs: string[] }>) : null))
      .then((data) => {
        if (data) setFlagged((existing) => new Set([...data.refs, ...existing]));
      })
      .catch(() => undefined);
  }, [signedIn]);

  const toggleFlag = useCallback(() => {
    if (!current) return;
    const ref = current.ref;
    const on = !flagged.has(ref);
    const apply = (value: boolean) =>
      setFlagged((existing) => {
        const updated = new Set(existing);
        if (value) updated.add(ref);
        else updated.delete(ref);
        return updated;
      });
    apply(on);
    setFlagError(false);
    void saveFlag(ref, on).then((saved) => {
      if (saved) return;
      apply(!on);
      setFlagError(true);
    });
  }, [current, flagged]);

  // Hide the site header and footer while answering.
  useLayoutEffect(() => {
    document.documentElement.dataset.focusMode = "unlimited";
    return () => {
      delete document.documentElement.dataset.focusMode;
    };
  }, []);

  useEffect(() => {
    storeSession(storageKey, session);
  }, [session, storageKey]);

  // Load the current question and the next few likely ones, so each appears instantly.
  useEffect(() => {
    if (!current || loadError) return;
    const queue = plan.current;
    const upcoming = [current.ref, ...queue.retry.map((item) => item.ref), ...queue.due.slice(0, 4), ...queue.fresh.slice(0, 6), ...queue.seen.slice(0, 2)];
    const missing = [...new Set(upcoming)].filter((ref) => !cache[ref] && !inFlight.current.has(ref)).slice(0, BATCH);
    if (missing.length === 0) return;
    missing.forEach((ref) => inFlight.current.add(ref));

    fetch(SET_ROUTES[set].questionsApi, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refs: missing })
    })
      .then(async (response) => {
        const data = (await response.json()) as { questions?: TestQuestion[]; error?: string };
        if (!response.ok || !data.questions) throw new Error(data.error ?? "Could not load questions.");
        // Keyed by the ref asked for (a copy on another exam may come back under its own).
        const loaded: Record<string, TestQuestion> = {};
        for (const item of data.questions) {
          const asked = missing.find((ref) => ref === refOf(item)) ?? null;
          if (asked) loaded[asked] = item;
        }
        setCache((existing) => ({ ...existing, ...loaded }));
        setLoadError(null);
      })
      .catch((error: Error) => setLoadError(error.message))
      .finally(() => missing.forEach((ref) => inFlight.current.delete(ref)));
  }, [cache, current, loadError, set]);

  const end = useCallback(
    async (wasExhausted = false) => {
      setEnding(true);
      const total = session.refs.length;
      let status: Finished["status"] = "signed-out-local";
      if (total > 0 && signedIn) {
        const result = await uploadAttempts([toUpload(session)]);
        status = result.status;
        if (result.saved.includes(session.id)) storeSession(storageKey, null);
      } else {
        storeSession(storageKey, null);
      }
      onEnd({ answered: total, correct: session.correct, missed: plan.current.misses.size, status, exhausted: wasExhausted });
    },
    [onEnd, session, signedIn, storageKey]
  );

  // Closing the tab mid-session: try to save it on the way out (the next visit
  // saves it otherwise).
  useEffect(() => {
    const onPageHide = () => {
      if (!signedIn || session.refs.length === 0) return;
      void fetch("/api/test-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attempts: [toUpload(session)] }),
        keepalive: true
      }).catch(() => undefined);
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [session, signedIn]);

  const check = useCallback(() => {
    if (!current || !question || !pending || chosen) return;
    const now = Date.now();
    const seconds = Math.min(MAX_SECONDS_PER_QUESTION, (now - shownAt.current) / 1000);
    const correct = pending === question.answer;
    const event = { ref: current.ref, correct, at: now };
    plan.current.answeredBefore.add(current.ref);

    if (!correct) {
      const misses = (plan.current.misses.get(current.ref) ?? 0) + 1;
      plan.current.misses.set(current.ref, misses);
      if (misses < MAX_MISSES_PER_SESSION) {
        plan.current.retry.push({ ref: current.ref, at: answered + 1 + RETRY_GAP + Math.floor(Math.random() * 3) });
        setReturnNote("You'll see this one again in a few questions");
      } else {
        setReturnNote("This one will come back next session");
      }
    } else {
      const card = buildReviewCards([...events, event]).get(current.ref);
      const when = card ? describeReturn(card, now) : null;
      setReturnNote(when && (current.kind !== "new" || (card?.lapses ?? 0) > 0) ? `Got it. This one comes back ${when}` : null);
    }

    onAnswer(event);
    setChosen(pending);
    setSession((existing) => ({
      ...existing,
      correct: existing.correct + (correct ? 1 : 0),
      refs: [...existing.refs, current.ref],
      answers: [...existing.answers, pending],
      elapsedSeconds: existing.elapsedSeconds + seconds
    }));
  }, [answered, chosen, current, events, onAnswer, pending, question]);

  const advance = useCallback(() => {
    const following = pickNext(plan.current, answered);
    setPending(null);
    setChosen(null);
    setReturnNote(null);
    setFlagError(false);
    shownAt.current = Date.now();
    window.scrollTo({ top: 0 });
    // Every question in the cluster used up.
    if (!following) void end(true);
    else setCurrent(following);
  }, [answered, end]);

  const next = advance;

  // Skipping isn't a miss: a new question goes to the back of the line, and a
  // review or retry comes back a few questions later.
  const skip = useCallback(() => {
    if (!current || chosen) return;
    if (current.kind === "new") plan.current.fresh.push(current.ref);
    else plan.current.retry.push({ ref: current.ref, at: answered + RETRY_GAP + 2 });
    advance();
  }, [advance, answered, chosen, current]);

  // Keyboard: A–D or 1–4 to pick what's shown in that slot, Enter to check or
  // continue, S to skip, F to flag.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (exitOpen || event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toUpperCase();
      const byNumber = ["1", "2", "3", "4"].indexOf(event.key);
      const byLetter = OPTION_KEYS.indexOf(key as TestOptionKey);
      if (!chosen && byLetter !== -1) setPending(order[byLetter]);
      else if (!chosen && byNumber !== -1) setPending(order[byNumber]);
      else if (!chosen && key === "S") skip();
      else if (signedIn && question && key === "F" && !event.repeat) toggleFlag();
      else if (event.key === "Enter" && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault();
        if (chosen) next();
        else check();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [check, chosen, exitOpen, next, order, question, signedIn, skip, toggleFlag]);

  // Room under the options for the bottom bar or feedback banner.
  const [bannerHeight, setBannerHeight] = useState(0);
  useLayoutEffect(() => {
    const element = banner.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setBannerHeight(element.offsetHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, [chosen, question]);

  const optionState = (key: TestOptionKey): AnswerState => {
    if (chosen && question) return key === question.answer ? "correct" : key === chosen ? "wrong" : "dimmed";
    return key === pending ? "selected" : "idle";
  };


  return (
    <div style={{ paddingBottom: bannerHeight + 24 }}>
      {/* Top bar: end, mode, running score */}
      <div className="fixed inset-x-0 top-0 z-30 border-b-[1.5px] border-rule bg-page">
        {/* Same width and side padding as the question column, so edges line up. */}
        <div className="mx-auto flex h-14 max-w-[752px] items-center gap-3 px-4 sm:h-16 sm:max-w-[768px] sm:px-6 lg:max-w-[784px] lg:px-8">
          <button
            type="button"
            onClick={() => (answered === 0 ? void end() : setExitOpen(true))}
            aria-label="End session"
            className="-ml-[11px] grid h-11 w-11 shrink-0 place-items-center rounded-control text-fg-muted transition-colors hover:bg-surface hover:text-fg"
          >
            <XIcon size={22} weight="bold" aria-hidden="true" />
          </button>
          <p className="min-w-0 flex-1 truncate text-small font-extrabold text-fg">{label}</p>
          <p className="shrink-0 text-small font-bold tabular-nums text-fg-muted" aria-live="polite">
            <span className="font-extrabold text-fg">{session.correct}</span> of {answered} correct
          </p>
        </div>
      </div>

      {question ? (
        <section aria-labelledby="unlimited-question" className="mx-auto max-w-[720px] pt-12 sm:pt-16">
          <div className="flex items-center justify-between gap-4">
            <p className="text-label font-bold text-fg-muted">Question {answered + (chosen ? 0 : 1)}</p>
            {signedIn ? (
              <FlagButton
                flagged={Boolean(current && flagged.has(current.ref))}
                onClick={(event) => {
                  toggleFlag();
                  // After a mouse click, Enter should still check or continue.
                  if (event.detail > 0) event.currentTarget.blur();
                }}
              />
            ) : null}
          </div>
          {flagError ? (
            <p role="status" className="mt-2 text-right text-small font-bold text-wrong-text">
              Couldn&apos;t save that flag. Try again.
            </p>
          ) : null}

          {chosen && returnNote ? (
            <p role="status" className="mt-3 text-small font-bold text-streak-text">
              {returnNote}
            </p>
          ) : null}

          <h1
            id="unlimited-question"
            className="mt-4 whitespace-pre-line font-body text-[19px] font-bold leading-snug text-fg [overflow-wrap:anywhere] min-[400px]:text-[20px] sm:text-[24px]"
          >
            {question.question}
          </h1>

          <div role="radiogroup" aria-labelledby="unlimited-question" className="mt-6 grid gap-3 [overflow-wrap:anywhere]">
            {order.map((key, slot) => {
              const state = optionState(key);
              return (
                <AnswerOption
                  key={OPTION_KEYS[slot]}
                  letter={OPTION_KEYS[slot]}
                  shortcut={String(slot + 1)}
                  state={state}
                  role="radio"
                  aria-checked={state === "selected" || (Boolean(chosen) && key === chosen)}
                  aria-disabled={Boolean(chosen) || undefined}
                  onClick={() => !chosen && setPending(key)}
                >
                  {question.options[key]}
                </AnswerOption>
              );
            })}
          </div>
        </section>
      ) : loadError ? (
        <div className="mx-auto max-w-md space-y-4 pt-24 text-center">
          <p className="font-bold text-fg">{loadError}</p>
          <Button onClick={() => setLoadError(null)}>Try again</Button>
        </div>
      ) : (
        <div className="pt-16">
          <LoadingState label={ending ? "Saving your session" : "Loading questions"} />
        </div>
      )}

      <div ref={banner} className="fixed inset-x-0 bottom-0 z-30">
        {question && chosen ? (
          <FeedbackBanner
            key={answered}
            bar
            tone={chosen === question.answer ? "correct" : "wrong"}
            correctAnswer={`${OPTION_KEYS[order.indexOf(question.answer)]}. ${question.options[question.answer]}`}
            explanation={question.explanation}
            continueLabel="Next question"
            onContinue={next}
          />
        ) : question ? (
          <div className="border-t-[1.5px] border-rule bg-page px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
            <div className="mx-auto flex max-w-[720px] items-center justify-between gap-3">
              <Button size="lg" variant="secondary" onClick={skip}>
                Skip
              </Button>
              <Button size="lg" onClick={check} disabled={!pending} className="flex-1 sm:min-w-[200px] sm:flex-none">
                Check
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {exitOpen ? (
        <TestDialog
          eyebrow={`${answered} ${answered === 1 ? "question" : "questions"} answered`}
          title="End this session?"
          cancelLabel="Keep going"
          confirmLabel={ending ? "Saving..." : "End session"}
          onCancel={() => setExitOpen(false)}
          onConfirm={() => {
            if (ending) return;
            setExitOpen(false);
            void end();
          }}
        >
          <p className="mt-3 text-fg">
            {signedIn
              ? "It'll be saved to your dashboard as a custom practice session."
              : "You're not logged in, so this session won't be saved."}
          </p>
        </TestDialog>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Summary after ending                                                */
/* ------------------------------------------------------------------ */

function Summary({
  set,
  label,
  finished,
  signedIn,
  onAgain
}: {
  set: QuestionSet;
  label: string;
  finished: Finished;
  signedIn: boolean;
  onAgain: () => void;
}) {
  const percent = finished.answered > 0 ? Math.round((finished.correct / finished.answered) * 100) : 0;
  const saved = finished.status === "saved";

  return (
    <HeroFadeIn>
      <div className="mx-auto max-w-xl space-y-8 py-4">
        <div className="space-y-2 text-center">
          <p className="text-label font-bold text-fg-muted">Infinite · {label}</p>
          <h1 className="font-display text-h2 font-extrabold text-fg sm:text-h1">
            {finished.exhausted ? "You answered every question!" : "Session complete"}
          </h1>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { value: finished.answered, label: "Answered" },
            { value: finished.correct, label: "Correct" },
            { value: `${percent}%`, label: "Accuracy" }
          ].map((tile) => (
            <div key={tile.label} className="card min-w-0 px-2 py-4 text-center">
              <p className="font-display text-[28px] font-extrabold leading-none tabular-nums text-fg sm:text-[36px]">{tile.value}</p>
              <p className="mt-2 text-small font-bold text-fg-muted">{tile.label}</p>
            </div>
          ))}
        </div>

        {signedIn ? (
          <p
            role="status"
            className={`rounded-control px-4 py-3 text-small font-bold ${saved ? "bg-correct-tint text-correct-text" : "bg-wrong-tint text-wrong-text"}`}
          >
            {saved
              ? "Saved to your dashboard as a custom practice session."
              : "Couldn't save this session right now. It's kept in this browser and will be saved next time you open Infinite."}
          </p>
        ) : (
          <p className="rounded-control bg-surface px-4 py-3 text-small font-semibold text-fg">
            <Link href={`/login?next=${SET_ROUTES[set].unlimited}`} className="font-extrabold text-brand-text hover:underline">
              Log in
            </Link>{" "}
            to save your sessions and see them on your dashboard.
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={onAgain} className="flex-1">
            Start another session
          </Button>
          {saved ? (
            <ButtonLink href="/account?tab=tests" size="lg" variant="secondary" className="flex-1">
              See it on your dashboard
            </ButtonLink>
          ) : null}
        </div>
      </div>
    </HeroFadeIn>
  );
}
