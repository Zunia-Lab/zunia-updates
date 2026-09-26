import Link from "next/link";
import { Shell } from "@/components/Shell";
import { listPublicReports } from "@/lib/queries";
import { formatDay, statusLabel } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Requests" };

export default async function RequestsPage() {
  const reports = await listPublicReports();
  return (
    <Shell active="requests">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-xl text-[15px] leading-relaxed text-fg-muted">
          Bugs and features we have accepted. A new report stays private until then. Shipping it is a separate step: we write the changelog entry.
        </p>
        <Link
          href="/requests/new"
          className="rounded-full bg-[var(--z-button)] px-4 py-2 text-[13px] text-[var(--z-button-fg)]"
        >
          Send a report
        </Link>
      </div>
      {reports.length === 0 ? (
        <p className="mt-8 text-fg-muted">Nothing public yet.</p>
      ) : (
        <ul className="mt-8 flex list-none flex-col gap-3 p-0">
          {reports.map((report) => (
            <li key={report.id} className="rounded-[16px] border border-[var(--z-line)] bg-[var(--z-surface)] px-5 py-4">
              <p className="text-[15px]">{report.title}</p>
              <p className="mt-2 font-mono text-[12px] text-fg-dim">
                {report.type === "bug" ? "Bug" : "Feature"} · {report.productName} · {statusLabel(report.status)}
                {report.version ? ` · ${report.version}` : ""} · {formatDay(report.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}
