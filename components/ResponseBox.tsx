type ResponseBoxProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onPracticeAgain: () => void;
  isJudging: boolean;
  disabled: boolean;
};

export function ResponseBox({
  value,
  onChange,
  onSubmit,
  onPracticeAgain,
  isJudging,
  disabled
}: ResponseBoxProps) {
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
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Type your roleplay response here. Aim for a clear structure: problem, recommendation, reasoning, and next steps."
          className="min-h-[300px] w-full rounded-[1.5rem] border border-line bg-[#fcfdff] px-5 py-4 text-base leading-8 text-ink outline-none ring-0 transition placeholder:text-muted/70 focus:border-accent"
        />

        <div className="mt-5 flex flex-col gap-3 rounded-[1.4rem] border border-line bg-[#f8fbff] px-5 py-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{value.trim().length} characters</p>
          <p>Judge feedback stays hidden until you submit.</p>
        </div>

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
