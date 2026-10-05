import { redirect } from "next/navigation";
import { AdminFrame } from "@/components/admin/AdminFrame";
import { QueueFilters } from "@/components/admin/QueueFilters";
import { ReportFeed } from "@/components/admin/ReportFeed";
import { Pager } from "@/components/Pager";
import { noticeFrom } from "@/lib/notices";
import { listHref, readPage, samePageParam } from "@/lib/paging";
import { listProducts, listQueue, type ReportQueue } from "@/lib/queries";
import { isProductId, isReportType } from "@/lib/types";

const HREF: Record<ReportQueue, string> = {
  review: "/admin",
  accepted: "/admin/accepted",
  fixed: "/admin/fixed",
  closed: "/admin/closed",
};

export async function QueueView({
  queue,
  title,
  lede,
  empty,
  searchParams,
}: {
  queue: ReportQueue;
  title: string;
  lede: string;
  empty: string;
  searchParams: Promise<{ saved?: string; error?: string; type?: string; product?: string; page?: string }>;
}) {
  const query = await searchParams;
  const type = query.type && isReportType(query.type) ? query.type : undefined;
  const productId = query.product && isProductId(query.product) ? query.product : undefined;
  const requested = readPage(query.page);
  const [result, products] = await Promise.all([
    listQueue(queue, type ?? null, productId ?? null, requested),
    listProducts(),
  ]);
  if (!samePageParam(query.page, result.page)) {
    redirect(listHref(HREF[queue], { type, product: productId, page: result.page }));
  }
  const href = (page: number) => listHref(HREF[queue], { type, product: productId, page });

  return (
    <AdminFrame active={queue} title={title} lede={lede} notice={noticeFrom(query)}>
      <QueueFilters href={HREF[queue]} type={type} productId={productId} products={products} />
      <div className="mt-4">
        <ReportFeed reports={result.items} empty={type || productId ? "Nothing in this view." : empty} />
        <Pager meta={result} href={href} />
      </div>
    </AdminFrame>
  );
}
