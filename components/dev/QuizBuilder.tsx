"use client";

import { CaretDownIcon, MagnifyingGlassIcon, MinusIcon, PlusIcon } from "@phosphor-icons/react";
import { useMemo, useState, useTransition } from "react";
import { listTestQuestions, saveShareQuiz, type PickableQuestion } from "@/app/dev/actions";
import { Button } from "@/components/ds/Button";
import { FieldLabel, Select, TextInput } from "@/components/ds/Field";
import { SegmentedControl } from "@/components/ds/SegmentedControl";
import { DEFAULT_QUESTION_COUNT, MAX_QUESTION_COUNT, type ShareQuiz } from "@/lib/share-quiz-shared";

export type DevTest = {
  id: string;
  title: string;
  meta: string;
  cluster: string;
  original: boolean;
  questionCount: number;
  areaCounts: Record<string, number>;
};

type Source = "tests" | "questions";

const BA_CORE = "Business Administration Core";
const isBaCore = (test: DevTest) => !test.original && test.cluster === BA_CORE;

const PRESETS: Array<{ label: string; pick: (test: DevTest) => boolean }> = [
  { label: "BA Core · State exams", pick: (test) => isBaCore(test) && /state/i.test(test.meta) },
  { label: "BA Core · every exam", pick: isBaCore },
  { label: "Every real DECA exam", pick: (test) => !test.original }
];

const testLabel = (test: DevTest) => [test.title, test.meta].filter(Boolean).join(" · ");

// Makes a new quiz, or edits one (`quiz`) while keeping its link and QR code.
export function QuizBuilder({ tests, quiz, onDone }: { tests: DevTest[]; quiz?: ShareQuiz; onDone?: () => void }) {
  const [title, setTitle] = useState(quiz?.title ?? "DECA Business Admin Core Quiz");
  const [count, setCount] = useState(quiz?.questionCount ?? DEFAULT_QUESTION_COUNT);
  const [source, setSource] = useState<Source>(quiz?.questionRefs.length ? "questions" : "tests");
  const [testIds, setTestIds] = useState<string[]>(() => quiz?.testIds ?? tests.filter(PRESETS[0].pick).map((test) => test.id));
  const [areas, setAreas] = useState<string[]>(quiz?.areas ?? []);
  const [refs, setRefs] = useState<string[]>(quiz?.questionRefs ?? []);
  const [message, setMessage] = useState<{ tone: "error" | "ok"; text: string } | null>(null);
  const [saving, startSaving] = useTransition();

  const selected = useMemo(() => tests.filter((test) => testIds.includes(test.id)), [testIds, tests]);

  // Instructional areas across the chosen tests, biggest first.
  const areaTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const test of selected) {
      for (const [area, n] of Object.entries(test.areaCounts)) totals.set(area, (totals.get(area) ?? 0) + n);
    }
    return [...totals.entries()].sort((left, right) => right[1] - left[1]);
  }, [selected]);

  const activeAreas = areas.filter((area) => areaTotals.some(([name]) => name === area));
  const poolSize =
    source === "questions"
      ? refs.length
      : areaTotals.reduce((sum, [area, n]) => sum + (activeAreas.length === 0 || activeAreas.includes(area) ? n : 0), 0);

  const toggle = (list: string[], item: string) => (list.includes(item) ? list.filter((value) => value !== item) : [...list, item]);

  const save = () => {
    setMessage(null);
    startSaving(async () => {
      const result = await saveShareQuiz(
        {
          title,
          testIds: source === "tests" ? testIds : [],
          areas: source === "tests" ? activeAreas : [],
          questionRefs: source === "questions" ? refs : [],
          questionCount: count
        },
        quiz?.id
      );
      if (!result.ok) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
      setMessage({ tone: "ok", text: quiz ? "Saved. The link and QR code stay the same." : "Quiz created. Its QR code is below." });
      onDone?.();
    });
  };

  return (
    <section aria-label={quiz ? "Edit quiz" : "New quiz"} className={quiz ? "space-y-6" : "card space-y-6"}>
      {quiz ? null : <h2 className="font-display text-h3 font-extrabold text-fg">New quiz</h2>}

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <FieldLabel label="Title (shown to people taking it)">
          <TextInput value={title} maxLength={80} onChange={(event) => setTitle(event.target.value)} />
        </FieldLabel>
        <div className="grid gap-1.5">
          <span className="text-label font-bold text-fg-muted">Questions per person</span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" aria-label="Fewer questions" className="px-3" onClick={() => setCount((n) => Math.max(1, n - 1))}>
              <MinusIcon size={16} weight="bold" aria-hidden="true" />
            </Button>
            <TextInput
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_QUESTION_COUNT}
              value={count}
              aria-label="Questions per person"
              onChange={(event) => setCount(Math.min(MAX_QUESTION_COUNT, Math.max(1, Number(event.target.value) || 1)))}
              className="w-20 text-center tabular-nums"
            />
            <Button
              variant="secondary"
              aria-label="More questions"
              className="px-3"
              onClick={() => setCount((n) => Math.min(MAX_QUESTION_COUNT, n + 1))}
            >
              <PlusIcon size={16} weight="bold" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <SegmentedControl<Source>
          label="Where questions come from"
          value={source}
          onChange={setSource}
          items={[
            { value: "tests", label: "Whole tests" },
            { value: "questions", label: "Hand-pick questions" }
          ]}
        />

        {source === "tests" ? (
          <>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setTestIds(tests.filter(preset.pick).map((test) => test.id));
                    setAreas([]);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
              <Button size="sm" variant="ghost" onClick={() => setTestIds([])}>
                Clear
              </Button>
            </div>

            <TestPicker tests={tests} selected={testIds} onToggle={(id) => setTestIds((list) => toggle(list, id))} />

            {areaTotals.length > 1 ? (
              <fieldset className="space-y-2">
                <legend className="text-label font-bold text-fg-muted">
                  Instructional areas {activeAreas.length === 0 ? "(all)" : `(${activeAreas.length} picked)`}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {areaTotals.map(([area, n]) => {
                    const on = activeAreas.includes(area);
                    return (
                      <button
                        key={area}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setAreas((list) => toggle(list, area))}
                        className={`min-h-9 rounded-full border-[1.5px] px-3 text-small font-bold transition-colors ${
                          on ? "border-brand bg-brand-tint text-brand-text" : "border-rule text-fg hover:border-rule-strong"
                        }`}
                      >
                        {area} <span className="tabular-nums text-fg-muted">{n}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}
          </>
        ) : (
          <QuestionPicker tests={tests} selected={refs} onChange={setRefs} />
        )}
      </div>

      <div className="flex flex-col gap-3 border-t-[1.5px] border-rule pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-small font-semibold text-fg-muted">
          <span className="font-extrabold tabular-nums text-fg">{poolSize}</span> questions in the pool ·{" "}
          {poolSize === 0
            ? "pick something to draw from"
            : poolSize <= count
              ? `everyone gets ${source === "questions" ? "these" : "all"} ${poolSize}`
              : `each person gets ${count} at random`}
        </p>
        <div className="flex gap-2">
          {onDone ? (
            <Button variant="secondary" onClick={onDone}>
              Cancel
            </Button>
          ) : null}
          <Button onClick={save} disabled={saving || poolSize === 0}>
            {saving ? "Saving..." : quiz ? "Save changes" : "Create quiz + QR code"}
          </Button>
        </div>
      </div>

      {message ? (
        <p
          role={message.tone === "error" ? "alert" : "status"}
          className={`rounded-control px-4 py-3 text-small font-bold ${
            message.tone === "error" ? "bg-wrong-tint text-wrong-text" : "bg-correct-tint text-correct-text"
          }`}
        >
          {message.text}
        </p>
      ) : null}
    </section>
  );
}

// Every test, grouped by real exams / originals and cluster, with a search box.
function TestPicker({ tests, selected, onToggle }: { tests: DevTest[]; selected: string[]; onToggle: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = tests.filter((test) => words.every((word) => `${testLabel(test)} ${test.cluster} ${test.id}`.toLowerCase().includes(word)));

  const groups = new Map<string, DevTest[]>();
  for (const test of matches) {
    const key = `${test.original ? "PrepPlay originals" : "Real DECA exams"} · ${test.cluster}`;
    groups.set(key, [...(groups.get(key) ?? []), test]);
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <MagnifyingGlassIcon size={18} weight="bold" aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-muted" />
        <TextInput
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tests, e.g. core 2025 state"
          aria-label="Search tests"
          className="pl-10"
        />
      </div>
      <p className="text-label font-bold text-fg-muted">{selected.length} tests picked</p>
      <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-control border-[1.5px] border-rule p-2">
        {[...groups.entries()].map(([group, items]) => {
          const picked = items.filter((test) => selected.includes(test.id)).length;
          return (
            <details key={group} open={words.length > 0 || picked > 0} className="group rounded-[10px]">
              <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 rounded-[10px] px-3 text-small font-extrabold text-fg hover:bg-surface">
                <span className="min-w-0 truncate">{group}</span>
                <span className="flex shrink-0 items-center gap-2 text-fg-muted">
                  {picked > 0 ? <span className="tabular-nums text-brand-text">{picked} picked</span> : null}
                  <CaretDownIcon size={14} weight="bold" aria-hidden="true" className="transition-transform group-open:rotate-180" />
                </span>
              </summary>
              <ul className="grid gap-1 px-1 pb-2 pt-1 sm:grid-cols-2">
                {items.map((test) => (
                  <li key={test.id}>
                    <label className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-small font-semibold text-fg hover:bg-surface">
                      <input type="checkbox" className="check" checked={selected.includes(test.id)} onChange={() => onToggle(test.id)} />
                      <span className="min-w-0 flex-1">
                        {test.meta || test.title}
                        <span className="block truncate text-label text-fg-muted">
                          {test.title} · {test.questionCount} q
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
        {groups.size === 0 ? <p className="px-3 py-4 text-small text-fg-muted">No tests match.</p> : null}
      </div>
    </div>
  );
}

// Browse one test at a time and tick individual questions; picks carry across tests.
function QuestionPicker({ tests, selected, onChange }: { tests: DevTest[]; selected: string[]; onChange: (refs: string[]) => void }) {
  const [testId, setTestId] = useState(() => selected[0]?.split("#")[0] ?? tests.find((test) => !test.original)?.id ?? tests[0]?.id);
  const [questions, setQuestions] = useState<{ testId: string; items: PickableQuestion[] } | null>(null);
  const [loading, startLoading] = useTransition();
  const [query, setQuery] = useState("");

  const load = (id: string) => {
    setTestId(id);
    startLoading(async () => setQuestions({ testId: id, items: await listTestQuestions(id) }));
  };

  const items = questions?.testId === testId ? questions.items : null;
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = items?.filter((item) => words.every((word) => `${item.question} ${item.area}`.toLowerCase().includes(word))) ?? [];
  const toggle = (ref: string) => onChange(selected.includes(ref) ? selected.filter((value) => value !== ref) : [...selected, ref]);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Select value={testId} onChange={(event) => load(event.target.value)} aria-label="Test to pick from">
          {tests.map((test) => (
            <option key={test.id} value={test.id}>
              {test.original ? "Original · " : ""}
              {testLabel(test)}
            </option>
          ))}
        </Select>
        {!items ? (
          <Button variant="secondary" onClick={() => load(testId)} disabled={loading}>
            {loading ? "Loading..." : "Show questions"}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-label font-bold text-fg-muted">{selected.length} questions picked (in the order you pick them)</p>
        {selected.length > 0 ? (
          <Button size="sm" variant="ghost" onClick={() => onChange([])}>
            Clear picks
          </Button>
        ) : null}
      </div>

      {items ? (
        <>
          <TextInput type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter these questions" aria-label="Filter questions" />
          <ul className="max-h-[480px] space-y-1 overflow-y-auto rounded-control border-[1.5px] border-rule p-2">
            {shown.map((item) => (
              <li key={item.ref}>
                <label className="flex cursor-pointer items-start gap-3 rounded-[10px] px-2 py-2 hover:bg-surface">
                  <input type="checkbox" className="check mt-0.5" checked={selected.includes(item.ref)} onChange={() => toggle(item.ref)} />
                  <span className="min-w-0 flex-1 text-small text-fg">
                    <span className="font-extrabold tabular-nums">{item.number}.</span> {item.question}
                    <span className="mt-0.5 block text-label font-bold text-fg-muted">{item.area}</span>
                  </span>
                </label>
              </li>
            ))}
            {shown.length === 0 ? <li className="px-3 py-4 text-small text-fg-muted">No questions match.</li> : null}
          </ul>
        </>
      ) : null}
    </div>
  );
}
