import Image from "next/image";
import Link from "next/link";
import { getViewer } from "@/lib/auth";

export async function Header() {
  const viewer = await getViewer();

  return (
    <header className="sticky top-0 z-20 border-b border-line/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[1.05rem] font-bold tracking-[-0.03em] text-ink transition hover:opacity-80"
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[1.1rem] shadow-[0_6px_16px_rgba(24,35,67,0.18)] ring-1 ring-[#16244a]/8">
            <Image
              src="/prepplay-mark.png"
              alt="PrepPlay logo"
              width={40}
              height={40}
              priority
              unoptimized
              className="h-10 w-10 object-cover"
            />
          </span>
          PrepPlay
        </Link>

        <nav className="flex items-center gap-0.5 text-sm">
          <Link
            href="/"
            className="rounded-full px-3.5 py-2 font-medium text-muted transition hover:bg-[#f5f7fb] hover:text-ink"
          >
            Home
          </Link>
          <Link
            href="/about"
            className="rounded-full px-3.5 py-2 font-medium text-muted transition hover:bg-[#f5f7fb] hover:text-ink"
          >
            About
          </Link>
          <Link
            href="/practice"
            className="ml-2 rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-5 py-2.5 font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition hover:scale-[1.02] hover:opacity-95"
          >
            Practice
          </Link>
          {viewer ? (
            <Link
              href="/account"
              className="ml-1 rounded-full border border-line bg-white px-4 py-2 font-medium text-ink transition hover:bg-[#f8fbff]"
            >
              <span className="hidden lg:inline">{viewer.email}</span>
              <span className="lg:hidden">Account</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="ml-1 rounded-full border border-line bg-white px-4 py-2 font-medium text-ink transition hover:bg-[#f8fbff]"
            >
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
