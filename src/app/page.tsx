import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Pager } from "@/components/Pager";
import { ReleaseList } from "@/components/ReleaseList";
import { Shell } from "@/components/Shell";
import { listHref, readPage, samePageParam } from "@/lib/paging";
import { listProducts, listReleasePage } from "@/lib/queries";
import { isProductId } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; page?: string }>;
}): Promise<Metadata> {
  const query = await searchParams;
  const selected = query.product && isProductId(query.product) ? query.product : undefined;
  const result = await listReleasePage(selected ?? null, readPage(query.page));
  const href = (page: number) => listHref("/", { product: selected, page });
  return {
    pagination: {
      previous: result.page > 1 ? href(result.page - 1) : null,
      next: result.page < result.pages ? href(result.page + 1) : null,
    },
  };
}

export default async function ChangelogPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; page?: string }>;
}) {
  const query = await searchParams;
  const selected = query.product && isProductId(query.product) ? query.product : undefined;
  const requested = readPage(query.page);
  const [products, result] = await Promise.all([
    listProducts(),
    listReleasePage(selected ?? null, requested),
  ]);
  if (!samePageParam(query.page, result.page)) {
    redirect(listHref("/", { product: selected, page: result.page }));
  }

  return (
    <Shell active="changelog">
      <p className="max-w-xl text-[17px] leading-snug tracking-[-0.02em] text-fg">What shipped.</p>
      <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-fg-muted">
        A release is written by Zunia. It does not have to start as a review.
      </p>
      <div className="mt-8 flex flex-wrap gap-1 border-b border-[var(--z-line)]">
        <Filter href="/" current={!selected}>
          All
        </Filter>
        {products.map((item) => (
          <Filter key={item.id} href={listHref("/", { product: item.id })} current={selected === item.id}>
            {item.name}
          </Filter>
        ))}
      </div>
      <div className="mt-2">
        <ReleaseList releases={result.items} />
        <Pager meta={result} href={(page) => listHref("/", { product: selected, page })} />
      </div>
    </Shell>
  );
}

function Filter({ href, current, children }: { href: string; current: boolean; children: string }) {
  return (
    <Link
      href={href}
      aria-current={current ? "true" : undefined}
      className={
        current
          ? "-mb-px border-b-2 border-[var(--z-button)] px-3 py-2 text-[13px] text-fg"
          : "-mb-px border-b-2 border-transparent px-3 py-2 text-[13px] text-fg-dim hover:text-fg"
      }
    >
      {children}
    </Link>
  );
}
