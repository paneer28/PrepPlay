"use client";

import { useEffect, useState } from "react";

const TEN_MINUTES = 10 * 60;
const TWO_MINUTES = 2 * 60;

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
  const [isVisible, setIsVisible] = useState(false);
  const [showTwoMinuteWarning, setShowTwoMinuteWarning] = useState(false);
  const [hasShownTwoMinuteWarning, setHasShownTwoMinuteWarning] = useState(false);

  useEffect(() => {
    if (!isRunning || secondsLeft === 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setSecondsLeft((current) => {
        const next = current > 0 ? current - 1 : 0;

        if (current > TWO_MINUTES && next <= TWO_MINUTES && !hasShownTwoMinuteWarning) {
          setShowTwoMinuteWarning(true);
          setHasShownTwoMinuteWarning(true);
        }

        return next;
      });
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [hasShownTwoMinuteWarning, isRunning, secondsLeft]);

  const hasStarted = secondsLeft !== TEN_MINUTES;
  const hasEnded = secondsLeft === 0;
  const statusLabel = hasEnded ? "Time is up" : isRunning ? "Timer running" : hasStarted ? "Timer paused" : "Ready to start";

  const handleReset = () => {
    setSecondsLeft(TEN_MINUTES);
    setIsRunning(false);
    setShowTwoMinuteWarning(false);
    setHasShownTwoMinuteWarning(false);
  };

  return (
    <>
      {showTwoMinuteWarning ? (
        <div className="pointer-events-none fixed inset-x-4 top-24 z-50 flex justify-center sm:inset-x-auto sm:right-6 sm:top-24">
          <div
            role="alert"
            aria-live="assertive"
            className="pointer-events-auto w-full max-w-sm rounded-[1.5rem] border border-amber-200 bg-white px-5 py-4 shadow-[0_18px_45px_rgba(16,24,40,0.18)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                  2-Minute Warning
                </p>
                <p className="mt-2 text-lg font-bold tracking-[-0.03em] text-ink">
                  You have 2 minutes left.
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Wrap up your recommendation and get ready to present confidently.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTwoMinuteWarning(false)}
                className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-[#f8fbff]"
              >
                Dismiss
              </button>
            </div>
            {!isVisible ? (
              <button
                type="button"
                onClick={() => setIsVisible(true)}
                className="mt-4 rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-4 py-2.5 text-sm font-semibold text-white shadow-card transition hover:scale-[1.01] hover:opacity-95"
              >
                Show timer
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <section className="border-b border-line/80 bg-[linear-gradient(135deg,#f8fbff,#f3f8ff)] p-6 sm:p-7">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsVisible((current) => !current)}
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink shadow-card transition hover:bg-[#f8fbff]"
            >
              {isVisible ? "Hide timer" : "Show timer"}
            </button>

            <div
              aria-live="polite"
              className="rounded-full border border-line bg-white px-4 py-3 text-sm font-semibold text-muted shadow-card"
            >
              {statusLabel}: <span className="ml-1 font-bold text-ink tabular-nums">{formatTime(secondsLeft)}</span>
            </div>
          </div>

          {isVisible ? (
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
                    {statusLabel}
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
                    onClick={handleReset}
                    className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-[#f8fbff]"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-line bg-white px-5 py-4 shadow-card">
              <p className="text-sm font-semibold text-ink">Timer is running in the background.</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Reveal it anytime if you want to watch the countdown, pause, or reset it.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
