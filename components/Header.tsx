import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-white/82 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-lg font-bold tracking-[-0.03em] text-ink">
          <span className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[1.35rem] bg-[linear-gradient(135deg,#1d4ed8,#38bdf8)] shadow-[0_14px_30px_rgba(37,99,235,0.24)] ring-1 ring-[#1d4f98]/10">
            <Image
              src="/prepplay-mark.svg"
              alt="PrepPlay logo"
              fill
              priority
              sizes="48px"
              className="object-contain p-[7px]"
            />
          </span>
          <span>PrepPlay</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm text-muted sm:gap-2">
          <Link
            href="/"
            className="rounded-full px-3 py-2 font-medium transition hover:text-ink"
          >
            Home
          </Link>
          <Link
            href="/practice"
            className="ml-1 rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-5 py-2.5 font-semibold text-white shadow-card transition hover:scale-[1.01] hover:opacity-95"
          >
            Start Practicing
          </Link>
        </nav>
      </div>
    </header>
  );
}
