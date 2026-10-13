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
  icons: {
    icon: "/prepplay-mark.png",
    shortcut: "/prepplay-mark.png",
    apple: "/prepplay-mark.png"
  },
  openGraph: {
    title: "PrepPlay",
    description:
      "Practice DECA roleplays with participant packets first and judge-side feedback after you submit.",
    url: siteUrl,
    siteName: "PrepPlay",
    type: "website"
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
      <body className="bg-canvas font-sans text-ink antialiased">
        <MotionProvider>
          <div className="relative z-10 flex min-h-screen flex-col">
            <Header />
            <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-20 pt-8 sm:px-6 lg:px-8">
              {children}
            </main>
            <Footer />
          </div>
        </MotionProvider>
        <Analytics />
      </body>
    </html>
  );
}
