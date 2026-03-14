"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
    <section className="surface overflow-hidden">
      <div className="border-b border-line/80 bg-[linear-gradient(135deg,#fbfdff,#f1f6ff)] p-7 sm:p-9">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Your Response</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.05em]">
              Submit what you would say
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-8 text-muted">
              Keep it structured and specific. The judge view stays hidden until you lock in your answer.
            </p>
          </div>
          <button
            type="button"
            onClick={onPracticeAgain}
            className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-[#f8fbff]"
          >
            Practice Again
          </button>
        </div>
      </div>

      <div className="p-7 sm:p-9">
        <div className="mb-5 flex flex-col gap-3 rounded-[1.4rem] border border-line bg-[#f8fbff] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Speak instead of typing</p>
            <p className="mt-1 text-sm leading-7 text-muted">
              Use your microphone to dictate your roleplay answer, then edit the transcript if you want.
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleRecording}
            disabled={!isSpeechSupported && !isRecording}
            className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
              isRecording
                ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                : "bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-white shadow-card hover:scale-[1.01] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            }`}
          >
            {isRecording ? "Stop Dictation" : "Start Dictation"}
          </button>
        </div>

        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Type your roleplay response here. Aim for a clear structure: problem, recommendation, reasoning, and next steps."
          className="min-h-[300px] w-full rounded-[1.5rem] border border-line bg-[#fcfdff] px-5 py-4 text-base leading-8 text-ink outline-none ring-0 transition placeholder:text-muted/70 focus:border-accent"
        />

        <div className="mt-5 flex flex-col gap-3 rounded-[1.4rem] border border-line bg-[#f8fbff] px-5 py-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{value.trim().length} characters</p>
          <p>
            {isRecording
              ? "Dictation is live. Your transcript will keep filling in as you speak."
              : "Judge feedback stays hidden until you submit."}
          </p>
        </div>

        {speechError ? <p className="mt-4 text-sm text-red-700">{speechError}</p> : null}
        {!isSpeechSupported ? (
          <p className="mt-4 text-sm text-muted">
            Speech-to-text works best in supported browsers like Chrome or Edge.
          </p>
        ) : null}

        <div className="mt-6">
          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled || isJudging}
            className="rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-6 py-3.5 text-sm font-semibold text-white shadow-card transition hover:scale-[1.01] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isJudging ? "Judging..." : "Submit For Judging"}
          </button>
        </div>
      </div>
    </section>
  );
}
