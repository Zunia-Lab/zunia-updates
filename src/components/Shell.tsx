import Link from "next/link";
import { Logo } from "@/components/Logo";

const LINKS = [
  { href: "/", label: "Changelog", id: "changelog" },
  { href: "/versions", label: "Versions", id: "versions" },
  { href: "/requests", label: "Reviews", id: "requests" },
] as const;

const FOOTER = [
  {
    title: "Zunia",
    links: [
      { label: "Website", href: "https://zunialab.com" },
      { label: "Documentation", href: "https://docs.zunialab.com" },
      { label: "Security", href: "https://zunialab.com/security" },
      { label: "Brand", href: "https://zunialab.com/brand" },
    ],
  },
  {
    title: "Extension",
    links: [
      { label: "Chrome", href: "https://zunialab.com/#platforms" },
      { label: "Edge", href: "https://zunialab.com/#platforms" },
      { label: "Firefox", href: "https://zunialab.com/#platforms" },
      { label: "Safari", href: "https://zunialab.com/#platforms" },
      { label: "Source", href: "https://github.com/Zunia-Lab/zunia-extension" },
    ],
  },
  {
    title: "Also",
    links: [
      { label: "Mobile", href: "https://github.com/Zunia-Lab/zunia-mobile" },
      { label: "GitHub", href: "https://github.com/Zunia-Lab" },
    ],
  },
] as const;

export function Shell({
  active,
  children,
}: {
  active: (typeof LINKS)[number]["id"];
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-8 sm:px-8 sm:py-12">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex items-center gap-3">
          <Logo size={32} />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-dim">Zunia</p>
            <h1 className="mt-1 text-[28px] font-medium leading-none tracking-[-0.04em]">Updates</h1>
          </div>
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
      <main className="mt-10 flex-1">{children}</main>
      <footer className="mt-16 border-t border-[var(--z-line)] pt-8">
        <div className="grid gap-8 sm:grid-cols-3">
          {FOOTER.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="m-0 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-dim">{column.title}</h2>
              <ul className="mt-3 flex list-none flex-col gap-2 p-0">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      rel="noreferrer"
                      className="text-[13px] text-fg-muted hover:text-fg"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className="mt-8 font-mono text-[12px] text-fg-dim">© {new Date().getFullYear()} Zunia Lab</p>
      </footer>
    </div>
  );
}
