"use client";

import { ArrowSquareOutIcon, CheckIcon, CopyIcon, DownloadSimpleIcon, PencilSimpleIcon, ProjectorScreenIcon, XIcon } from "@phosphor-icons/react";
import QRCode from "qrcode";
import { useEffect, useState, useTransition } from "react";
import { deleteShareQuiz, setShareQuizActive } from "@/app/dev/actions";
import { QuizBuilder, type DevTest } from "@/components/dev/QuizBuilder";
import { Button } from "@/components/ds/Button";
import { Tag } from "@/components/ds/Tag";
import { TestDialog } from "@/components/TestDialog";
import type { ShareQuiz } from "@/lib/share-quiz-shared";

// One quiz on /dev: its QR code, link, stats and controls.
export function QuizCard({ quiz, url, svg, poolSize, tests }: { quiz: ShareQuiz; url: string; svg: string; poolSize: number; tests: DevTest[] }) {
  const [editing, setEditing] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const average = quiz.answeredTotal > 0 ? Math.round((quiz.correctTotal / quiz.answeredTotal) * 100) : null;
  const source =
    quiz.questionRefs.length > 0
      ? `${quiz.questionRefs.length} hand-picked questions`
      : `${quiz.testIds.length} ${quiz.testIds.length === 1 ? "test" : "tests"}${quiz.areas.length ? ` · ${quiz.areas.join(", ")}` : ""}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Couldn't copy. Select the link and copy it instead.");
    }
  };

  const download = async () => {
    const dataUrl = await QRCode.toDataURL(url, { width: 1200, margin: 2, errorCorrectionLevel: "M" });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `prepplay-quiz-${quiz.id}.png`;
    link.click();
  };

  const run = (action: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "Something went wrong.");
    });
  };

  return (
    <article className="card space-y-5">
      <div className={`flex flex-col gap-5 sm:flex-row ${quiz.active ? "" : "opacity-60"}`}>
        <button
          type="button"
          onClick={() => setPresenting(true)}
          aria-label={`Show the QR code for ${quiz.title} full screen`}
          className="mx-auto w-44 shrink-0 rounded-control bg-white p-2 sm:mx-0 [&_svg]:h-auto [&_svg]:w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {quiz.active ? <Tag tone="correct">Live</Tag> : <Tag tone="wrong">Turned off</Tag>}
            <Tag>{quiz.questionCount} questions</Tag>
          </div>
          <h3 className="font-display text-h4 font-extrabold text-fg [overflow-wrap:anywhere]">{quiz.title}</h3>
          <p className="text-small text-fg-muted [overflow-wrap:anywhere]">
            {source} · {poolSize} in the pool
          </p>
          <p className="text-small font-bold text-fg">
            {quiz.plays} {quiz.plays === 1 ? "finish" : "finishes"}
            {average !== null ? <span className="text-fg-muted"> · {average}% average</span> : null}
          </p>
          <div className="flex min-w-0 items-center gap-2">
            <a href={url} target="_blank" rel="noreferrer" className="min-w-0 truncate text-small font-bold text-brand-text hover:underline">
              {url.replace(/^https?:\/\//, "")}
            </a>
            <button
              type="button"
              onClick={copy}
              aria-label="Copy link"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-control text-fg-muted hover:bg-surface hover:text-fg"
            >
              {copied ? <CheckIcon size={18} weight="bold" aria-hidden="true" /> : <CopyIcon size={18} weight="bold" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setPresenting(true)} icon={<ProjectorScreenIcon size={16} weight="bold" aria-hidden="true" />}>
          Present
        </Button>
        <Button size="sm" variant="secondary" onClick={download} icon={<DownloadSimpleIcon size={16} weight="bold" aria-hidden="true" />}>
          PNG
        </Button>
        <a href={url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
          <ArrowSquareOutIcon size={16} weight="bold" aria-hidden="true" />
          Open
        </a>
        <Button size="sm" variant="secondary" onClick={() => setEditing((open) => !open)} icon={<PencilSimpleIcon size={16} weight="bold" aria-hidden="true" />}>
          Edit
        </Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setShareQuizActive(quiz.id, !quiz.active))}>
          {quiz.active ? "Turn off" : "Turn on"}
        </Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => setConfirmDelete(true)} className="text-wrong-text">
          Delete
        </Button>
      </div>

      {error ? (
        <p role="alert" className="rounded-control bg-wrong-tint px-4 py-3 text-small font-bold text-wrong-text">
          {error}
        </p>
      ) : null}

      {editing ? (
        <div className="border-t-[1.5px] border-rule pt-5">
          <QuizBuilder tests={tests} quiz={quiz} onDone={() => setEditing(false)} />
        </div>
      ) : null}

      {presenting ? <PresentQr title={quiz.title} url={url} svg={svg} onClose={() => setPresenting(false)} /> : null}

      {confirmDelete ? (
        <TestDialog
          danger
          eyebrow="This can't be undone"
          title="Delete this quiz?"
          cancelLabel="Keep it"
          confirmLabel="Delete quiz"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            run(() => deleteShareQuiz(quiz.id));
          }}
        >
          <p className="mt-3 text-fg">Its link and QR code stop working. To pause it instead, use Turn off.</p>
        </TestDialog>
      ) : null}
    </article>
  );
}

// A big QR code over everything, for projecting during a presentation.
function PresentQr({ title, url, svg, onClose }: { title: string; url: string; svg: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.documentElement.requestFullscreen?.().catch(() => undefined);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={`QR code for ${title}`} className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-6 bg-white p-6 text-center text-[#1a1a1a]">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full bg-black/5 hover:bg-black/10"
      >
        <XIcon size={24} weight="bold" aria-hidden="true" />
      </button>
      <p className="font-display text-[clamp(24px,4vw,48px)] font-extrabold leading-tight">{title}</p>
      <div className="aspect-square w-[min(70vh,80vw)] [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
      <p className="text-[clamp(16px,2.2vw,28px)] font-bold">Scan with your phone camera · {url.replace(/^https?:\/\//, "")}</p>
    </div>
  );
}
