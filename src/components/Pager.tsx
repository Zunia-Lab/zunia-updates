import Link from "next/link";
import { pageSlots, type PageMeta } from "@/lib/paging";

export function Pager({ meta, href }: { meta: PageMeta; href: (page: number) => string }) {
  if (meta.pages <= 1) return null;
  const start = (meta.page - 1) * meta.size + 1;
  const end = Math.min(meta.total, meta.page * meta.size);
  const slots = pageSlots(meta.page, meta.pages);

  return (
    <nav aria-label="Pages" className="mt-8 flex flex-wrap items-center justify-between gap-3">
      <p className="font-mono text-[12px] text-fg-dim">
        {start}-{end} of {meta.total}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        <Step href={meta.page > 1 ? href(meta.page - 1) : undefined}>Previous</Step>
        {slots.map((slot, index) =>
          slot === "gap" ? (
            <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-[13px] text-fg-dim">
              …
            </span>
          ) : (
            <Link
              key={slot}
              href={href(slot)}
              aria-current={slot === meta.page ? "page" : undefined}
              className={
                slot === meta.page
                  ? "rounded-full bg-[var(--z-state-hover)] px-3 py-1 text-[13px] text-fg"
                  : "rounded-full px-3 py-1 text-[13px] text-fg-muted hover:bg-[var(--z-state-hover)] hover:text-fg"
              }
            >
              {slot}
            </Link>
          ),
        )}
        <Step href={meta.page < meta.pages ? href(meta.page + 1) : undefined}>Next</Step>
      </div>
    </nav>
  );
}

function Step({ href, children }: { href?: string; children: string }) {
  if (!href) {
    return (
      <span aria-disabled="true" className="px-3 py-1 text-[13px] text-fg-dim">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-1 text-[13px] text-fg-muted hover:bg-[var(--z-state-hover)] hover:text-fg"
    >
      {children}
    </Link>
  );
}
