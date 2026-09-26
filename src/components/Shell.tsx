import Link from "next/link";

const LINKS = [
  { href: "/", label: "Changelog", id: "changelog" },
  { href: "/versions", label: "Versions", id: "versions" },
  { href: "/requests", label: "Requests", id: "requests" },
] as const;

export function Shell({
  active,
  children,
}: {
  active: (typeof LINKS)[number]["id"];
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-dim">Zunia</p>
          <h1 className="mt-1 text-[28px] font-medium tracking-[-0.04em]">Updates</h1>
        </div>
        <nav aria-label="Sections" className="flex flex-wrap gap-2">
          {LINKS.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              aria-current={link.id === active ? "page" : undefined}
              className={
                link.id === active
                  ? "rounded-full bg-[var(--z-button)] px-3 py-1.5 text-[13px] text-[var(--z-button-fg)]"
                  : "rounded-full px-3 py-1.5 text-[13px] text-fg-muted hover:bg-[var(--z-state-hover)] hover:text-fg"
              }
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/requests/new"
            className="rounded-full border border-[var(--z-line)] px-3 py-1.5 text-[13px] text-fg hover:bg-[var(--z-state-hover)]"
          >
            Report
          </Link>
        </nav>
      </header>
      <main className="mt-10">{children}</main>
    </div>
  );
}
