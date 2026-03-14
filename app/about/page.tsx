export default function AboutPage() {
  return (
    <div className="space-y-10 pb-10 pt-8">
      <section className="surface p-8 sm:p-10">
        <p className="eyebrow">About PrepPlay</p>
        <h1 className="mt-4 max-w-[12ch] text-4xl font-bold leading-[0.95] tracking-[-0.05em] text-ink sm:text-6xl">
          A real page is here. The full story comes next.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">
          This placeholder About page is ready for your final copy. Once you send over the exact text,
          we can turn it into a polished founder story, mission section, credibility area, and call to action.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <article className="surface-soft p-6">
          <p className="eyebrow">Section 1</p>
          <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-ink">Who built it</h2>
          <p className="mt-3 text-base leading-8 text-muted">
            This block is ready for your founder background, DECA experience, and why you decided to build PrepPlay.
          </p>
        </article>
        <article className="surface-soft p-6">
          <p className="eyebrow">Section 2</p>
          <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-ink">Why it exists</h2>
          <p className="mt-3 text-base leading-8 text-muted">
            This can explain the problem with current DECA prep and why a participant-first practice tool matters.
          </p>
        </article>
        <article className="surface-soft p-6">
          <p className="eyebrow">Section 3</p>
          <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-ink">What comes next</h2>
          <p className="mt-3 text-base leading-8 text-muted">
            This area is set up for roadmap items, future features, or a short invitation to start practicing.
          </p>
        </article>
      </section>
    </div>
  );
}
