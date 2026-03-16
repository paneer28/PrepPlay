import Image from "next/image";
import Link from "next/link";
import { getViewer } from "@/lib/auth";

export async function Header() {
  const viewer = await getViewer();

  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-white/82 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-lg font-bold tracking-[-0.03em] text-ink">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[1.35rem] shadow-[0_14px_30px_rgba(24,35,67,0.22)] ring-1 ring-[#16244a]/10">
            <Image
              src="/prepplay-mark.png"
              alt="PrepPlay logo"
              width={48}
              height={48}
              priority
              unoptimized
              className="h-12 w-12 object-cover"
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
          {viewer ? (
            <Link
              href="/account"
              className="rounded-full border border-line bg-white px-4 py-2 font-medium text-ink transition hover:bg-[#f8fbff]"
            >
              <span className="hidden lg:inline">{viewer.email}</span>
              <span className="lg:hidden">Account</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-line bg-white px-4 py-2 font-medium text-ink transition hover:bg-[#f8fbff]"
            >
              Log in / Sign up
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
