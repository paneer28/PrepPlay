"use client";

import { ArrowCounterClockwiseIcon, MicrophoneIcon, StopIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ds/Button";

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike extends Event {
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionConstructorLike {
  new (): SpeechRecognitionLike;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructorLike;
    webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
  }
}

type ResponseBoxProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onPracticeAgain: () => void;
  isJudging: boolean;
  disabled: boolean;
};

function mergeTranscript(base: string, transcript: string) {
  const trimmedBase = base.trim();
  const trimmedTranscript = transcript.trim();

  if (!trimmedTranscript) {
    return base;
  }

  return trimmedBase ? `${trimmedBase} ${trimmedTranscript}` : trimmedTranscript;
}

export function ResponseBox({
  value,
  onChange,
  onSubmit,
  onPracticeAgain,
  isJudging,
  disabled
}: ResponseBoxProps) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const baseValueRef = useRef("");
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const speechRecognitionConstructor = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
  }, []);

  const isSpeechSupported = Boolean(speechRecognitionConstructor);

  useEffect(() => {
    if (!speechRecognitionConstructor) {
      return;
    }

    const recognition = new speechRecognitionConstructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let fullTranscript = "";

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript?.trim();

        if (transcript) {
          fullTranscript += `${transcript} `;
        }
      }

      onChange(mergeTranscript(baseValueRef.current, fullTranscript));
    };

    recognition.onerror = (event) => {
      setSpeechError(
        event.error === "not-allowed"
          ? "Microphone access was blocked. Allow microphone access to use dictation."
          : "Speech-to-text had trouble listening. Try again or type your response instead."
      );
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [onChange, speechRecognitionConstructor]);

  function handleToggleRecording() {
    if (!recognitionRef.current) {
      setSpeechError("Speech-to-text is not available in this browser. You can still type your response.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    baseValueRef.current = value;
    setSpeechError(null);

    try {
      recognitionRef.current.start();
      setIsRecording(true);
    } catch {
      setSpeechError("Dictation could not start yet. Wait a moment and try again.");
    }
  }

  return (
    <section aria-labelledby="response-title" className="card space-y-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-label font-bold text-fg-muted">Your response</p>
          <h2 id="response-title" className="font-display text-h2 font-extrabold text-fg">
            Submit what you would say
          </h2>
          <p className="max-w-2xl text-fg">Keep it structured and specific. The judge view stays hidden until you lock in your answer.</p>
        </div>
        <Button variant="secondary" onClick={onPracticeAgain} icon={<ArrowCounterClockwiseIcon size={18} weight="bold" aria-hidden="true" />}>
          Practice Again
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-control bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-small font-extrabold text-fg">Speak instead of typing</p>
          <p className="mt-0.5 text-small text-fg-muted">
            Use your microphone to dictate your roleplay answer, then edit the transcript if you want.
          </p>
        </div>
        <Button
          variant={isRecording ? "danger" : "primary"}
          onClick={handleToggleRecording}
          disabled={!isSpeechSupported && !isRecording}
          icon={
            isRecording ? (
              <StopIcon size={18} weight="fill" aria-hidden="true" />
            ) : (
              <MicrophoneIcon size={18} weight="bold" aria-hidden="true" />
            )
          }
          className="shrink-0"
        >
          {isRecording ? "Stop Dictation" : "Start Dictation"}
        </Button>
      </div>

      <div className="space-y-2">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Your roleplay response"
          placeholder="Type your roleplay response here. Aim for a clear structure: problem, recommendation, reasoning, and next steps."
          className="field min-h-[300px] resize-y py-4 text-body font-medium leading-relaxed"
        />
        <div className="flex flex-col gap-1 text-small sm:flex-row sm:items-center sm:justify-between">
          <p className="font-bold tabular-nums text-fg">{value.trim().length} characters</p>
          <p className={isRecording ? "font-bold text-wrong-text" : "text-fg-muted"}>
            {isRecording
              ? "Dictation is live. Your transcript will keep filling in as you speak."
              : "Judge feedback stays hidden until you submit."}
          </p>
        </div>
      </div>

      {speechError ? <p className="text-small font-bold text-wrong-text">{speechError}</p> : null}
      {!isSpeechSupported ? (
        <p className="text-small text-fg-muted">Speech-to-text works best in supported browsers like Chrome or Edge.</p>
      ) : null}

      <Button size="lg" onClick={onSubmit} disabled={disabled || isJudging} className="w-full sm:w-auto">
        {isJudging ? "Judging..." : "Submit For Judging"}
      </Button>
    </section>
  );
}
