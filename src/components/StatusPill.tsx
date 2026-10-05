import { statusLabel, type ReportStatus } from "@/lib/types";

export function StatusPill({ status }: { status: ReportStatus }) {
  return (
    <span className="shrink-0 rounded-full border border-[var(--z-line)] px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.08em] text-fg-muted">
      {statusLabel(status)}
    </span>
  );
}
