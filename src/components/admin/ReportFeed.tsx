import Link from "next/link";
import { StatusPill } from "@/components/StatusPill";
import type { ReportView } from "@/lib/types";
import { formatDay, releaseLabel, teamLabel, typeLabel, waitingForVersion } from "@/lib/types";

export function ReportFeed({ reports, empty }: { reports: ReportView[]; empty: string }) {
  if (reports.length === 0) {
    return <p className="text-[14px] text-fg-dim">{empty}</p>;
  }
  return (
    <ul className="flex list-none flex-col gap-2 p-0">
      {reports.map((report) => {
        const reply = report.comments.at(-1);
        return (
          <li key={report.id}>
            <Link
              href={`/admin/reports/${report.id}`}
              className="block rounded-[16px] border border-[var(--z-line)] bg-[var(--z-surface)] px-4 py-3.5 hover:bg-[var(--z-state-hover)]"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[15px] leading-snug">{report.title}</p>
                <StatusPill status={report.status} />
              </div>
              <p className="mt-2 font-mono text-[12px] text-fg-dim">
                {typeLabel(report.type)} · {report.productName} · {formatDay(report.createdAt)}
              </p>
              {report.version ? (
                <p className="mt-2 text-[13px] text-fg-muted">
                  Fixed in {releaseLabel(report.productName, report.version)}
                </p>
              ) : waitingForVersion(report.status) ? (
                <p className="mt-2 text-[13px] text-fg-muted">Accepted. No version yet.</p>
              ) : report.status === "in_progress" ? (
                <p className="mt-2 text-[13px] text-fg-muted">In development. Version still to choose.</p>
              ) : null}
              {reply ? (
                <p className="mt-1 text-[13px] text-fg-dim">{teamLabel(reply.team)} replied</p>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
