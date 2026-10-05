import type { ReactNode } from "react";

export const fieldClass =
  "w-full rounded-[12px] border border-[var(--z-line)] bg-[var(--z-bg)] px-3 py-2.5 text-[14px] text-fg outline-none focus:border-[color-mix(in_srgb,var(--z-fg)_35%,var(--z-line))]";

export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 text-[14px] ${className ?? ""}`}>
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-dim">{label}</span>
      {hint ? <span className="text-[12px] leading-relaxed text-fg-dim">{hint}</span> : null}
      {children}
    </label>
  );
}

export function Block({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-dim">{label}</p>
        {hint ? <p className="mt-1 text-[12px] leading-relaxed text-fg-dim">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}
