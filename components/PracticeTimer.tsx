"use client";

import { ClockIcon, EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ds/Button";

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
        <div className="pointer-events-none fixed inset-x-4 top-20 z-50 flex justify-center sm:inset-x-auto sm:right-6">
          <div
            role="alert"
            aria-live="assertive"
            className="ds animate-popover-in pointer-events-auto w-full max-w-sm rounded-card border-[1.5px] border-wrong/40 bg-page p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-1.5 text-label font-extrabold text-wrong-text">
                  <ClockIcon size={16} weight="bold" aria-hidden="true" />
                  2-minute warning
                </p>
                <p className="mt-1 font-display text-h4 font-extrabold text-fg">You have 2 minutes left.</p>
                <p className="mt-1 text-small text-fg">Wrap up your recommendation and get ready to present confidently.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowTwoMinuteWarning(false)}>
                Dismiss
              </Button>
            </div>
            {!isVisible ? (
              <Button size="sm" className="mt-4" onClick={() => setIsVisible(true)}>
                Show timer
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <section aria-label="Prep timer" className="border-y-[1.5px] border-rule bg-surface px-6 py-4 sm:px-8">
        {isVisible ? (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-5">
              <div aria-live="polite">
                <p className="text-label font-bold text-fg-muted">{statusLabel}</p>
                <p className={`font-display text-h1 font-extrabold tabular-nums leading-none ${hasEnded ? "text-wrong-text" : "text-fg"}`}>
                  {formatTime(secondsLeft)}
                </p>
              </div>
              <div className="hidden max-w-sm sm:block">
                <p className="text-small font-extrabold text-fg">10-minute roleplay timer</p>
                <p className="text-label font-semibold text-fg-muted">
                  The timer starts automatically when this packet is generated. You can pause or reset it at any point.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setIsRunning(true)} disabled={isRunning || hasEnded}>
                {hasStarted ? "Resume" : "Start"}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setIsRunning(false)} disabled={!isRunning}>
                Pause
              </Button>
              <Button size="sm" variant="ghost" onClick={handleReset}>
                Reset
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsVisible(false)} icon={<EyeSlashIcon size={16} weight="bold" aria-hidden="true" />}>
                Hide timer
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-small font-bold text-fg-muted" aria-live="polite">
              <ClockIcon size={18} weight="bold" aria-hidden="true" />
              {statusLabel}
            </p>
            <Button size="sm" variant="secondary" onClick={() => setIsVisible(true)} icon={<EyeIcon size={16} weight="bold" aria-hidden="true" />}>
              Show timer
            </Button>
          </div>
        )}
      </section>
    </>
  );
}
