// People who helped build PrepPlay, shown on /contributors (linked quietly
// from the About page). To add someone, copy a line and fill it in:
//
//   { name: "Jordan Lee", role: "Wrote practice questions", emoji: "📝", note: "ICDC finalist 2025", link: "https://..." },
//
// Only `name` and `role` are required. Without an emoji the tile shows initials.
// Tiles get their colours automatically, in the order listed.

export type Contributor = {
  name: string;
  role: string;
  emoji?: string;
  note?: string;
  link?: string;
};

export const contributors: Contributor[] = [
  { name: "Your name", role: "Founder", emoji: "🚀", note: "Built PrepPlay" }
];
