import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/app/admin/actions";
import { Logo } from "@/components/Logo";
import { requireAdmin } from "@/lib/admin";
import { queueCounts, type ReportQueue } from "@/lib/queries";
import { teamLabel } from "@/lib/types";

const QUEUES: { id: ReportQueue; href: string; label: string }[] = [
  { id: "review", href: "/admin", label: "Needs review" },
  { id: "accepted", href: "/admin/accepted", label: "Accepted" },
  { id: "fixed", href: "/admin/fixed", label: "Fixed" },
  { id: "closed", href: "/admin/closed", label: "Closed" },
];

export async function AdminFrame({
  active,
  title,
  lede,
  notice,
  children,
}: {
  active: ReportQueue | "versions" | "report";
  title: string;
  lede: string;
  notice?: string;
  children: ReactNode;
}) {
  const team = await requireAdmin();
  const counts = await queueCounts();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 md:flex-row md:items-start md:px-8 md:py-10">
      <aside className="md:sticky md:top-8 md:w-56 md:shrink-0">
        <div className="flex items-center gap-3">
          <Logo size={28} />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-dim">Zunia</p>
            <p className="mt-1 text-[15px] font-medium leading-none">{teamLabel(team)}</p>
          </div>
        </div>
        <nav aria-label="Admin" className="mt-6 flex gap-1 overflow-x-auto md:flex-col">
          {QUEUES.map((item) => (
            <NavLink key={item.id} href={item.href} current={active === item.id} count={counts[item.id]}>
              {item.label}
            </NavLink>
          ))}
          <div className="mx-1 hidden h-px bg-[var(--z-line)] md:my-2 md:block" />
          <NavLink href="/admin/versions" current={active === "versions"}>
            Versions
          </NavLink>
        </nav>
        <div className="mt-6 hidden flex-col gap-2 md:flex">
          <Link href="/requests" className="text-[13px] text-fg-dim hover:text-fg">
            Public reviews
          </Link>
          <form action={logout}>
            <button type="submit" className="text-[13px] text-fg-dim hover:text-fg">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-medium leading-none tracking-[-0.04em]">{title}</h1>
            <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-fg-muted">{lede}</p>
          </div>
          <div className="flex gap-4 md:hidden">
            <Link href="/requests" className="text-[13px] text-fg-dim hover:text-fg">
              Public reviews
            </Link>
            <form action={logout}>
              <button type="submit" className="text-[13px] text-fg-dim hover:text-fg">
                Sign out
              </button>
            </form>
          </div>
        </header>
        {notice ? (
          <p className="mt-6 rounded-[12px] border border-[var(--z-line)] bg-[var(--z-surface)] px-4 py-3 text-[14px] text-fg-muted">
            {notice}
          </p>
        ) : null}
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}

function NavLink({
  href,
  current,
  count,
  children,
}: {
  href: string;
  current: boolean;
  count?: number;
  children: string;
}) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={
        current
          ? "flex shrink-0 items-center justify-between gap-3 rounded-[12px] bg-[var(--z-state-hover)] px-3 py-2 text-[14px] text-fg"
          : "flex shrink-0 items-center justify-between gap-3 rounded-[12px] px-3 py-2 text-[14px] text-fg-muted hover:bg-[var(--z-state-hover)] hover:text-fg"
      }
    >
      <span>{children}</span>
      {typeof count === "number" ? (
        <span className="font-mono text-[12px] text-fg-dim">{count}</span>
      ) : null}
    </Link>
  );
}
