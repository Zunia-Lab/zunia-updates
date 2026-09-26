import Link from "next/link";
import { ReleaseList } from "@/components/ReleaseList";
import { Shell } from "@/components/Shell";
import { listProducts, listReleases } from "@/lib/queries";
import { isProductId } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ChangelogPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product } = await searchParams;
  const selected = product && isProductId(product) ? product : undefined;
  const [products, releases] = await Promise.all([listProducts(), listReleases(selected)]);

  return (
    <Shell active="changelog">
      <p className="max-w-xl text-[15px] leading-relaxed text-fg-muted">
        What shipped. A release is written by Zunia. It does not have to start as a request.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Filter href="/" current={!selected}>
          All
        </Filter>
        {products.map((item) => (
          <Filter key={item.id} href={`/?product=${item.id}`} current={selected === item.id}>
            {item.name}
          </Filter>
        ))}
      </div>
      <div className="mt-8">
        <ReleaseList releases={releases} />
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
          ? "rounded-full border border-[var(--z-line)] bg-[var(--z-glass)] px-3 py-1 text-[13px] text-fg"
          : "rounded-full px-3 py-1 text-[13px] text-fg-dim hover:text-fg"
      }
    >
      {children}
    </Link>
  );
}
