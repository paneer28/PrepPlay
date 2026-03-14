import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Avenir Next", "SF Pro Text", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"]
      },
      colors: {
        canvas: "#f5f7fb",
        ink: "#0f172a",
        muted: "#667085",
        line: "#e4e9f2",
        accent: "#2563eb",
        accentSoft: "#e8f0ff",
        judge: "#eaf2ff",
        judgeSoft: "#f5f8ff"
      },
      boxShadow: {
        soft: "0 28px 70px rgba(15, 23, 42, 0.08)",
        card: "0 12px 32px rgba(15, 23, 42, 0.06)"
      },
      borderRadius: {
        xl2: "1.5rem"
      }
    }
  },
  plugins: []
};

export default config;
