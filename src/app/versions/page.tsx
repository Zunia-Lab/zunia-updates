import { redirect } from "next/navigation";
import { Pager } from "@/components/Pager";
import { ReleaseList } from "@/components/ReleaseList";
import { Shell } from "@/components/Shell";
import { listHref, pageParam, readPage } from "@/lib/paging";
import { listProducts, listReleasePage } from "@/lib/queries";
import { PRODUCTS } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Versions" };

export default async function VersionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const products = await listProducts();
  const groups = await Promise.all(
    products.map(async (product) => {
      const raw = query[product.id];
      const given = typeof raw === "string" ? raw : undefined;
      const result = await listReleasePage(product.id, readPage(given));
      return { product, given, result };
    }),
  );
  const canonical: Record<string, string | undefined> = {};
  let dirty = false;
  for (const group of groups) {
    const want = pageParam(group.result.page);
    if (group.given !== want) dirty = true;
    if (want) canonical[group.product.id] = want;
  }
  if (dirty) redirect(listHref("/versions", canonical, PRODUCTS));

  return (
    <Shell active="versions">
      <p className="max-w-xl text-[15px] leading-relaxed text-fg-muted">
        Each line names the product and the version. Extension and Mobile use a store version. Wallet and Website use a dated ship.
      </p>
      <div className="mt-10 flex flex-col gap-12">
        {groups.map(({ product, result }) => (
          <section key={product.id} aria-labelledby={`product-${product.id}`}>
            <div className="flex items-baseline justify-between gap-4 border-b border-[var(--z-line)] pb-3">
              <h2 id={`product-${product.id}`} className="text-[18px] font-medium tracking-[-0.03em]">
                {product.name}
              </h2>
              <p className="font-mono text-[12px] text-fg-dim">
                {result.total === 0 ? "No releases" : result.total === 1 ? "1 release" : `${result.total} releases`}
              </p>
            </div>
            <div className="mt-2">
              {result.total === 0 ? (
                <p className="py-6 text-[14px] text-fg-dim">No releases yet.</p>
              ) : (
                <ReleaseList releases={result.items} />
              )}
              <Pager
                meta={result}
                href={(page) => listHref("/versions", { ...canonical, [product.id]: page }, PRODUCTS)}
              />
            </div>
          </section>
        ))}
      </div>
    </Shell>
  );
}
