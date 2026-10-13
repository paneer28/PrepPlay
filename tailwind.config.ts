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
        sans: ["Avenir Next", "SF Pro Text", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
        display: ["var(--font-bricolage)", "var(--font-nunito)", "sans-serif"],
        body: ["var(--font-nunito)", "ui-rounded", "Segoe UI", "sans-serif"]
      },
      // Type scale: 40 / 32 / 24 / 20 / 17 (body) / 15 / 13.
      fontSize: {
        h1: ["40px", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        h2: ["32px", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        h3: ["24px", { lineHeight: "1.25", letterSpacing: "-0.02em" }],
        h4: ["20px", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
        body: ["17px", { lineHeight: "1.55" }],
        small: ["15px", { lineHeight: "1.5" }],
        label: ["13px", { lineHeight: "1.4" }]
      },
      colors: {
        // Design system v2 (CSS variables in globals.css, light + dark).
        fg: { DEFAULT: "var(--fg)", muted: "var(--fg-muted)" },
        page: "var(--page)",
        surface: "var(--surface)",
        rule: { DEFAULT: "var(--rule)", strong: "var(--rule-strong)" },
        track: "var(--track)",
        raised: "var(--raised)",
        brand: { DEFAULT: "var(--brand)", edge: "var(--brand-edge)", tint: "var(--brand-tint)", text: "var(--brand-text)" },
        correct: {
          DEFAULT: "var(--correct)",
          edge: "var(--correct-edge)",
          tint: "var(--correct-tint)",
          text: "var(--correct-text)",
          fill: "var(--correct-fill)"
        },
        wrong: {
          DEFAULT: "var(--wrong)",
          edge: "var(--wrong-edge)",
          tint: "var(--wrong-tint)",
          text: "var(--wrong-text)",
          fill: "var(--wrong-fill)"
        },
        streak: { DEFAULT: "var(--streak)", edge: "var(--streak-edge)", tint: "var(--streak-tint)", text: "var(--streak-text)" },
        disabled: { DEFAULT: "var(--disabled)", fg: "var(--disabled-fg)" },
        // Old palette, removed once every screen is migrated.
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
        xl2: "1.5rem",
        control: "var(--radius-control)",
        card: "var(--radius-card)"
      }
    }
  },
  plugins: []
};

export default config;
