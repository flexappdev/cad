import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm bg-brand" />
          <span className="font-semibold tracking-tight">CAD</span>
          <span className="text-sm text-slate-500">· Course A Day</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-slate-700">
          <Link href="/library">Library</Link>
          <Link href="/about">About</Link>
          <Link href="/login" className="text-slate-500">Login</Link>
        </nav>
      </div>
    </header>
  );
}
