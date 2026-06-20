"use client";

import { Suspense, useState } from "react";
import { Header } from "./Header";
import { LeftNav } from "./LeftNav";
import { Footer } from "./Footer";

/**
 * The v3 layout shell — sticky header (52px), collapsible left nav
 * (220↔56px), sticky footer (40px). Wraps page content in a scroll
 * area sized to the remaining viewport.
 */
export function Shell({
  children,
  footerCount,
  showNav = true,
}: {
  children: React.ReactNode;
  footerCount?: number;
  showNav?: boolean;
}) {
  const [navOpen, setNavOpen] = useState(true);

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <Header onToggleNav={() => setNavOpen((o) => !o)} />
      <div className="flex flex-1 min-h-0">
        {showNav && (
          <Suspense fallback={<div className="w-[220px] shrink-0" />}>
            <LeftNav open={navOpen} />
          </Suspense>
        )}
        <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
      </div>
      <Footer count={footerCount} />
    </div>
  );
}
