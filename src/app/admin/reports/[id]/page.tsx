import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminFrame } from "@/components/admin/AdminFrame";
import { ReportManager } from "@/components/admin/ReportManager";
import { requireAdmin } from "@/lib/admin";
import { noticeFrom } from "@/lib/notices";
import { getReport, listReleases } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = { title: "Review" };

export default async function AdminReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const team = await requireAdmin();
  const report = await getReport(id);
  if (!report) notFound();
  const releases = await listReleases(report.productId);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <AdminFrame
      active="report"
      title="Review"
      lede="The full note, the replies, and the next step. Accept before you attach a version."
      notice={noticeFrom(query)}
    >
      <p className="mb-4">
        <Link href={backHref(report.status)} className="text-[13px] text-fg-dim hover:text-fg">
          Back to {backLabel(report.status)}
        </Link>
      </p>
      <ReportManager report={report} team={team} releases={releases} today={today} />
    </AdminFrame>
  );
}

function backHref(status: string) {
  if (status === "new") return "/admin";
  if (status === "shipped") return "/admin/fixed";
  if (status === "declined" || status === "spam") return "/admin/closed";
  return "/admin/accepted";
}

function backLabel(status: string) {
  if (status === "new") return "needs review";
  if (status === "shipped") return "fixed";
  if (status === "declined" || status === "spam") return "closed";
  return "accepted";
}
