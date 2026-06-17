export function Footer() {
  return (
    <footer className="border-t border-slate-200 mt-16">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
        <span>© {new Date().getFullYear()} CAD — Course A Day</span>
        <div className="flex gap-5">
          <a href="/feed.xml">RSS</a>
          <a href="https://github.com/flexappdev/cad">GitHub</a>
          <a href="/about">About</a>
        </div>
      </div>
    </footer>
  );
}
