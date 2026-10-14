// People who helped build PrepPlay, shown on /contributors (linked quietly
// from the About page). To add someone, copy a line and fill it in:
//
//   { name: "Jordan Lee", role: "Wrote practice questions", emoji: "📝", note: "ICDC finalist 2025", link: "https://..." },
//
// Only `name` is required. Without an emoji the tile shows initials.
// Tiles get their colours automatically, in the order listed.

export type Contributor = {
  name: string;
  role?: string;
  emoji?: string;
  note?: string;
  link?: string;
  // Small tilted stickers on the tile, e.g. honours.
  stickers?: string[];
};

export const contributors: Contributor[] = [
  { name: "Nishanth Munnaluru" },
  { name: "Aazyan Eman" },
  { name: "Eric Wetzell" },
  { name: "Igor Ermolaev" },
  { name: "Ruhaannvir Singh" },
  { name: "Naile Melaku" },
  { name: "Laksh Shah" },
  { name: "Sashank Munnaluru" },
  { name: "Talin Mishra" },
  { name: "Sanu Chennamaneni" },
  { name: "Avi Mishra" }
];
