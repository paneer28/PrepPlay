import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site";

const seoKeywords = [
  "PrepPlay",
  "prepplay",
  "DECA roleplay",
  "DECA roleplay practice",
  "DECA practice roleplays",
  "DECA roleplay generator",
  "DECA event practice",
  "business finance series event practice",
  "accounting applications series event practice",
  "DECA finance roleplay practice",
  "DECA marketing roleplay practice",
  "DECA hospitality roleplay practice",
  "DECA entrepreneurship roleplay practice",
  "DECA HRM roleplay practice",
  "performance indicator practice",
  "DECA competition prep"
];

export const metadata: Metadata = {
  title: "DECA Roleplay Practice | PrepPlay",
  description:
    "PrepPlay helps DECA students practice roleplays with participant packets, event situations, performance indicators, judge feedback, and repeat roleplay drills across finance, marketing, hospitality, entrepreneurship, and business management.",
  keywords: seoKeywords,
  alternates: {
    canonical: "/deca-roleplay-practice"
  },
  openGraph: {
    title: "DECA Roleplay Practice | PrepPlay",
    description:
      "Practice DECA roleplays online with participant-first packets, performance indicators, and judge-side feedback.",
    url: "/deca-roleplay-practice",
    siteName: "PrepPlay",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "DECA Roleplay Practice | PrepPlay",
    description:
      "Practice DECA roleplays online with participant-first packets, performance indicators, and judge-side feedback."
  }
};

const relatedSearches = [
  "DECA roleplay practice",
  "DECA roleplay generator",
  "DECA finance roleplay practice",
  "Business Finance Series Event practice",
  "Accounting Applications Series Event practice",
  "DECA marketing roleplay practice",
  "DECA hospitality roleplay practice",
  "DECA entrepreneurship roleplay practice",
  "DECA human resources management roleplay practice",
  "DECA performance indicators practice"
];

const featureBlocks = [
  {
    title: "Participant-first roleplay packets",
    copy:
      "PrepPlay shows the event name, cluster, participant instructions, 21st century skills, performance indicators, and event situation before any judging appears."
  },
  {
    title: "Judge-side feedback after submission",
    copy:
      "After the response is submitted, the round opens judge characterization, follow-up questions, PI scoring, strengths, weaknesses, missed opportunities, and suggested improvements."
  },
  {
    title: "Practice across major DECA clusters",
    copy:
      "The app supports business management and administration, finance, marketing, hospitality and tourism, and entrepreneurship roleplay practice."
  },
  {
    title: "Repeat practice with event variety",
    copy:
      "Students can generate another roleplay quickly, track prior rounds in their account, and keep practicing without reloading the whole workflow."
  }
];

export default function DecaRoleplayPracticePage() {
  const siteUrl = getSiteUrl();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "PrepPlay",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: `${siteUrl}/deca-roleplay-practice`,
    description:
      "PrepPlay is a web app for DECA roleplay practice with participant packets, performance indicators, event situations, and judge-side scoring.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    },
    keywords: seoKeywords.join(", ")
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10 pb-10 pt-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="surface p-8 sm:p-10">
        <p className="eyebrow">DECA Roleplay Practice</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-[-0.05em] text-ink sm:text-6xl">
          PrepPlay helps students practice DECA roleplays online.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">
          This page exists to help students, competitors, and parents find PrepPlay when searching
          for DECA roleplay practice, DECA event preparation, performance indicator practice, and
          DECA roleplay generators. The actual practice experience lives inside the full PrepPlay
          workspace.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/practice"
            className="rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-7 py-3.5 text-base font-semibold text-white shadow-card transition hover:scale-[1.01] hover:opacity-95"
          >
            Start DECA Roleplay Practice
          </Link>
          <Link
            href="/"
            className="rounded-full border border-line bg-white px-7 py-3.5 text-base font-semibold text-ink transition hover:bg-[#f8fbff]"
          >
            Back to PrepPlay Home
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {featureBlocks.map((block) => (
          <article key={block.title} className="surface-soft p-6">
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-ink">{block.title}</h2>
            <p className="mt-3 text-base leading-8 text-muted">{block.copy}</p>
          </article>
        ))}
      </section>

      <section className="surface p-8 sm:p-10">
        <p className="eyebrow">What Students Search For</p>
        <div className="mt-5 flex flex-wrap gap-3">
          {relatedSearches.map((search) => (
            <span
              key={search}
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-muted shadow-card"
            >
              {search}
            </span>
          ))}
        </div>
        <div className="mt-8 space-y-5 text-base leading-8 text-muted">
          <p>
            PrepPlay is designed for DECA competitors who want realistic roleplay practice instead
            of a generic chat interface. Students can practice business finance, accounting,
            marketing, hospitality, entrepreneurship, and business management roleplays through a
            participant-first flow that mirrors competition order.
          </p>
          <p>
            Each practice round focuses on event situations, relevant performance indicators, and a
            structured response. After the round is submitted, PrepPlay reveals judge-side scoring,
            follow-up questions, strengths, weaknesses, and improvement suggestions. That makes it
            useful for DECA roleplay prep, DECA competition prep, and repeated event practice.
          </p>
        </div>
      </section>
    </div>
  );
}

