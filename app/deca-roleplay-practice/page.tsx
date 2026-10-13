import type { Metadata } from "next";
import { ButtonLink } from "@/components/ds/Button";
import { Tag } from "@/components/ds/Tag";
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
    <div className="mx-auto max-w-5xl space-y-14 pb-10 pt-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="space-y-5">
        <h1 className="max-w-3xl font-display text-[40px] font-extrabold leading-[1.05] tracking-[-0.03em] text-fg sm:text-[56px]">
          PrepPlay helps students practice DECA roleplays online.
        </h1>
        <p className="max-w-3xl text-[19px] leading-relaxed text-fg">
          This page exists to help students, competitors, and parents find PrepPlay when searching for DECA roleplay practice, DECA
          event preparation, performance indicator practice, and DECA roleplay generators. The actual practice experience lives
          inside the full PrepPlay workspace.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <ButtonLink href="/practice" size="lg">
            Start DECA Roleplay Practice
          </ButtonLink>
          <ButtonLink href="/" size="lg" variant="ghost">
            Back to PrepPlay Home
          </ButtonLink>
        </div>
      </section>

      <section className="grid gap-x-10 gap-y-8 border-t-[1.5px] border-rule pt-10 md:grid-cols-2">
        {featureBlocks.map((block) => (
          <article key={block.title}>
            <h2 className="font-display text-h3 font-extrabold text-fg">{block.title}</h2>
            <p className="mt-2 text-fg">{block.copy}</p>
          </article>
        ))}
      </section>

      <section className="card space-y-5 sm:p-8">
        <h2 className="font-display text-h3 font-extrabold text-fg">What students search for</h2>
        <div className="flex flex-wrap gap-2">
          {relatedSearches.map((search) => (
            <Tag key={search} className="whitespace-normal">
              {search}
            </Tag>
          ))}
        </div>
        <div className="space-y-4 text-fg">
          <p>
            PrepPlay is designed for DECA competitors who want realistic roleplay practice instead of a generic chat interface.
            Students can practice business finance, accounting, marketing, hospitality, entrepreneurship, and business management
            roleplays through a participant-first flow that mirrors competition order.
          </p>
          <p>
            Each practice round focuses on event situations, relevant performance indicators, and a structured response. After the
            round is submitted, PrepPlay reveals judge-side scoring, follow-up questions, strengths, weaknesses, and improvement
            suggestions. That makes it useful for DECA roleplay prep, DECA competition prep, and repeated event practice.
          </p>
        </div>
      </section>
    </div>
  );
}
