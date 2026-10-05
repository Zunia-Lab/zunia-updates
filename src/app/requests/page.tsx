import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell } from "@/components/Shell";
import { StatusPill } from "@/components/StatusPill";
import { QueueFilters } from "@/components/admin/QueueFilters";
import { Pager } from "@/components/Pager";
import { listHref, readPage, samePageParam } from "@/lib/paging";
import { listProducts, listPublicReports } from "@/lib/queries";
import {
  formatDay,
  isProductId,
  isReportType,
  plainExcerpt,
  releaseLabel,
  teamLabel,
  typeLabel,
  type ReportView,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; product?: string; page?: string }>;
}): Promise<Metadata> {
  const query = await searchParams;
  const type = query.type && isReportType(query.type) ? query.type : undefined;
  const productId = query.product && isProductId(query.product) ? query.product : undefined;
  const result = await listPublicReports(type ?? null, productId ?? null, readPage(query.page));
  const href = (page: number) => listHref("/requests", { type, product: productId, page });
  return {
    title: "Reviews",
    pagination: {
      previous: result.page > 1 ? href(result.page - 1) : null,
      next: result.page < result.pages ? href(result.page + 1) : null,
    },
  };
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; product?: string; page?: string }>;
}) {
  const query = await searchParams;
  const type = query.type && isReportType(query.type) ? query.type : undefined;
  const productId = query.product && isProductId(query.product) ? query.product : undefined;
  const requested = readPage(query.page);
  const [result, products] = await Promise.all([
    listPublicReports(type ?? null, productId ?? null, requested),
    listProducts(),
  ]);
  if (!samePageParam(query.page, result.page)) {
    redirect(listHref("/requests", { type, product: productId, page: result.page }));
  }
  const visible = result.items;

  return (
    <Shell active="requests">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-xl text-[15px] leading-relaxed text-fg-muted">
          Accepted bugs and features. A report stays private until we accept it. Open one for the full note, the full replies, and the version if it shipped.
        </p>
        <Link
          href="/requests/new"
          className="rounded-full bg-[var(--z-button)] px-4 py-2 text-[13px] text-[var(--z-button-fg)]"
        >
          Send a report
        </Link>
      </div>
      <div className="mt-6">
        <QueueFilters href="/requests" type={type} productId={productId} products={products} />
      </div>
      {visible.length === 0 ? (
        <p className="mt-8 text-fg-muted">{type || productId ? "Nothing in this view." : "Nothing public yet."}</p>
      ) : (
        <ul className="mt-6 flex list-none flex-col gap-3 p-0">
          {visible.map((report) => (
            <li key={report.id}>
              <ReviewCard report={report} />
            </li>
          ))}
        </ul>
      )}
      <Pager meta={result} href={(page) => listHref("/requests", { type, product: productId, page })} />
    </Shell>
  );
}

function ReviewCard({ report }: { report: ReportView }) {
  const note = plainExcerpt(report.body, 180);
  return (
    <Link
      href={`/requests/${report.id}`}
      className="block rounded-[16px] border border-[var(--z-line)] bg-[var(--z-surface)] px-4 py-3.5 hover:bg-[var(--z-state-hover)]"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] leading-snug">{report.title}</p>
        <StatusPill status={report.status} />
      </div>
      <p className="mt-2 font-mono text-[12px] text-fg-dim">
        {typeLabel(report.type)} · {report.productName} · {formatDay(report.createdAt)}
      </p>
      {note ? <p className="mt-3 text-[14px] leading-relaxed text-fg-muted">{note}</p> : null}
      {report.comments.length > 0 ? (
        <ul className="mt-3 flex list-none flex-col gap-2 border-t border-[var(--z-line)] p-0 pt-3">
          {report.comments.map((comment) => (
            <li key={comment.id}>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-dim">
                {teamLabel(comment.team)} · {formatDay(comment.createdAt)}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">{plainExcerpt(comment.body, 140)}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {report.status === "shipped" && report.version ? (
        <p className="mt-3 text-[13px] text-fg-muted">Fixed in {releaseLabel(report.productName, report.version)}</p>
      ) : null}
    </Link>
  );
}
