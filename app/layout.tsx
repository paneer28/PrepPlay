import type { Metadata } from "next";
import { Bricolage_Grotesque, Nunito } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MotionProvider } from "@/components/ui/motion-provider";
import { getSiteUrl } from "@/lib/site";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const body = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap" });

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "PrepPlay",
  applicationName: "PrepPlay",
  // Opened from the iPhone Home Screen, PrepPlay runs without Safari's bars (see app/manifest.ts).
  appleWebApp: { capable: true, title: "PrepPlay", statusBarStyle: "default" },
  description:
    "Practice DECA roleplays with participant packets first and judge-side feedback after you submit.",
  keywords: [
    "PrepPlay",
    "DECA roleplay",
    "DECA roleplay practice",
    "DECA practice",
    "DECA competition prep",
    "DECA performance indicators",
    "roleplay generator"
  ],
  // Favicons come from app/favicon.ico, app/icon.svg and app/apple-icon.png.
  openGraph: {
    title: "PrepPlay",
    description:
      "Practice DECA roleplays with participant packets first and judge-side feedback after you submit.",
    url: siteUrl,
    siteName: "PrepPlay",
    type: "website",
    images: [{ url: "/brand/prepplay-logo-1200.png", width: 1200, alt: "PrepPlay" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "PrepPlay",
    description:
      "Practice DECA roleplays with participant packets first and judge-side feedback after you submit."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        {/* Applies a saved light/dark choice before first paint (no flash). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="ds bg-page text-fg antialiased">
        <MotionProvider>
          {/* overflow-x-clip: full-bleed bands are 100vw wide, which includes any scrollbar. */}
          <div className="relative z-10 flex min-h-screen flex-col overflow-x-clip">
            <Header />
            <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-20 pt-8 sm:px-6 lg:px-8">{children}</main>
            <Footer />
          </div>
        </MotionProvider>
        <Analytics />
      </body>
    </html>
  );
}
