export function Footer({ count, year = new Date().getFullYear() }: { count?: number; year?: number }) {
  return (
    <footer className="sticky bottom-0 z-20 h-[40px] flex items-center gap-4 px-4 border-t border-border bg-[var(--surface-1)] text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
        Live
      </span>
      {typeof count === "number" && (
        <span>
          <span className="text-foreground font-medium">{count.toLocaleString()}</span> courses
        </span>
      )}
      <span className="ml-auto">
        <a className="hover:text-foreground" href="/feed.xml">RSS</a>
        <span className="mx-2">·</span>
        <a className="hover:text-foreground" href="/about">About</a>
        <span className="mx-2">·</span>
        <a className="hover:text-foreground" href="https://github.com/flexappdev/cad">GitHub</a>
      </span>
      <span className="hidden sm:inline">© {year} CAD</span>
    </footer>
  );
}
