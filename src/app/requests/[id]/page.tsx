import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentList } from "@/components/CommentList";
import { Markdown } from "@/components/Markdown";
import { Shell } from "@/components/Shell";
import { StatusPill } from "@/components/StatusPill";
import { getPublicReport } from "@/lib/queries";
import { formatDay, kindLabel, releaseLabel, typeLabel } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getPublicReport(id);
  return { title: report ? report.title : "Review" };
}

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getPublicReport(id);
  if (!report) notFound();
  const fix = report.fix;

  return (
    <Shell active="requests">
      <p>
        <Link href="/requests" className="text-[13px] text-fg-dim hover:text-fg">
          All reviews
        </Link>
      </p>
      <article className="mt-6 rounded-[16px] border border-[var(--z-line)] bg-[var(--z-surface)] px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-[22px] font-medium leading-snug tracking-[-0.03em]">{report.title}</h2>
          <StatusPill status={report.status} />
        </div>
        <p className="mt-2 font-mono text-[12px] text-fg-dim">
          {typeLabel(report.type)} · {report.productName} · {formatDay(report.createdAt)}
        </p>
        <Markdown source={report.body} />
      </article>

      <section className="mt-4 rounded-[16px] border border-[var(--z-line)] bg-[var(--z-surface)] px-5 py-5">
        <h3 className="text-[16px] font-medium">Replies</h3>
        {report.comments.length === 0 ? (
          <p className="mt-2 text-[14px] text-fg-dim">No reply yet.</p>
        ) : (
          <CommentList comments={report.comments} />
        )}
      </section>

      {report.status === "shipped" && report.version ? (
        <section className="mt-4 rounded-[16px] border border-[var(--z-line)] bg-[var(--z-surface)] px-5 py-5">
          <h3 className="text-[16px] font-medium">Fixed in {releaseLabel(report.productName, report.version)}</h3>
          {fix ? (
            <p className="mt-2 font-mono text-[12px] text-fg-dim">{formatDay(fix.releasedOn)}</p>
          ) : null}
          {fix?.summary ? <p className="mt-3 text-[14px] leading-relaxed text-fg-muted">{fix.summary}</p> : null}
          {fix ? (
            <div className="mt-4 border-t border-[var(--z-line)] pt-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-dim">{kindLabel(fix.kind)}</p>
              <p className="mt-2 text-[15px]">{fix.title}</p>
              {fix.body ? <Markdown source={fix.body} /> : null}
            </div>
          ) : null}
          <p className="mt-4">
            <Link href="/versions" className="text-[13px] text-fg-muted underline">
              See the version
            </Link>
          </p>
        </section>
      ) : null}
    </Shell>
  );
}
