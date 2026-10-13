import type { Metadata } from "next";
import { ContributorWall } from "@/components/contributors/ContributorWall";
import { Tag } from "@/components/ds/Tag";
import { contributors } from "@/data/contributors";

// A quiet "thank you" page: linked only from About, kept out of search and the sitemap.
export const metadata: Metadata = {
  title: "Contributors | PrepPlay",
  robots: { index: false, follow: false }
};

export default function ContributorsPage() {
  return (
    <div className="space-y-10 pb-12 pt-4">
      <header className="mx-auto max-w-2xl space-y-3 text-center">
        <Tag tone="streak">Thank you! 🎉</Tag>
        <h1 className="font-display text-[40px] font-extrabold leading-[1.05] tracking-[-0.03em] text-fg sm:text-[52px]">
          The people behind PrepPlay
        </h1>
        <p className="text-fg">Everyone who helped build, test, and improve PrepPlay. Tap a tile to celebrate them.</p>
      </header>
      <ContributorWall people={contributors} />
    </div>
  );
}
