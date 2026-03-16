import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrepPlay",
  description:
    "Practice DECA roleplays with participant packets first and judge-side feedback after you submit.",
  icons: {
    icon: "/prepplay-mark.png",
    shortcut: "/prepplay-mark.png",
    apple: "/prepplay-mark.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-canvas font-sans text-ink antialiased">
        <div className="relative z-10 flex min-h-screen flex-col">
          <Header />
          <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-20 pt-8 sm:px-6 lg:px-8">
            {children}
          </main>
          <Footer />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
