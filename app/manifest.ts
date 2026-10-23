import type { MetadataRoute } from "next";

// Lets PrepPlay be added to a phone's Home Screen and open as its own app,
// without the browser's tabs and address bar. On iPhone this is the only way
// to practice without Safari's bars (lib/fullscreen.ts covers iPad and computers).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PrepPlay",
    short_name: "PrepPlay",
    description: "Practice DECA roleplays and exams.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/brand/prepplay-app-icon-light-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/prepplay-app-icon-light-512.png", sizes: "512x512", type: "image/png" }
    ]
  };
}
