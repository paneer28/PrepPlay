"use client";

import { useEffect, useState } from "react";

const TEN_MINUTES = 10 * 60;

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

type PracticeTimerProps = {
  autoStart?: boolean;
};

export function PracticeTimer({ autoStart = false }: PracticeTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(TEN_MINUTES);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    if (!isRunning || secondsLeft === 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setSecondsLeft((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [isRunning, secondsLeft]);

  const hasStarted = secondsLeft !== TEN_MINUTES;
  const hasEnded = secondsLeft === 0;

  return (
    <section className="border-b border-line/80 bg-[linear-gradient(135deg,#f8fbff,#f3f8ff)] p-6 sm:p-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="eyebrow">Prep Timer</p>
          <h2 className="mt-3 text-2xl font-bold tracking-[-0.05em] text-ink">10-minute roleplay timer</h2>
          <p className="mt-3 max-w-2xl text-base leading-8 text-muted">
            The timer starts automatically when this packet is generated. You can pause or reset it at any point.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div
            aria-live="polite"
            className="min-w-[180px] rounded-[1.55rem] border border-line bg-white px-5 py-4 shadow-card"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              {hasEnded ? "Time is up" : isRunning ? "Timer running" : hasStarted ? "Timer paused" : "Ready to start"}
            </p>
            <p className="mt-2 text-4xl font-bold tracking-[-0.05em] text-ink tabular-nums">
              {formatTime(secondsLeft)}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsRunning(true)}
              disabled={isRunning || hasEnded}
              className="rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:scale-[1.01] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {hasStarted ? "Resume" : "Start"}
            </button>
            <button
              type="button"
              onClick={() => setIsRunning(false)}
              disabled={!isRunning}
              className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Pause
            </button>
            <button
              type="button"
              onClick={() => {
                setSecondsLeft(TEN_MINUTES);
                setIsRunning(false);
              }}
              className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-[#f8fbff]"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
