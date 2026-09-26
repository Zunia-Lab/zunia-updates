import { ReleaseList } from "@/components/ReleaseList";
import { Shell } from "@/components/Shell";
import { listReleasesByProduct } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = { title: "Versions" };

export default async function VersionsPage() {
  const groups = await listReleasesByProduct();
  return (
    <Shell active="versions">
      <p className="max-w-xl text-[15px] leading-relaxed text-fg-muted">
        The same releases, grouped by product. Extension and Mobile use a store version. Wallet and Website use a dated ship.
      </p>
      <div className="mt-10 flex flex-col gap-12">
        {groups.map(({ product, releases }) => (
          <section key={product.id} aria-labelledby={`product-${product.id}`}>
            <div className="flex items-baseline justify-between gap-4 border-b border-[var(--z-line)] pb-3">
              <h2 id={`product-${product.id}`} className="text-[18px] font-medium tracking-[-0.03em]">
                {product.name}
              </h2>
              <p className="font-mono text-[12px] text-fg-dim">
                {releases.length === 0 ? "No releases" : releases.length === 1 ? "1 release" : `${releases.length} releases`}
              </p>
            </div>
            <div className="mt-2">
              {releases.length === 0 ? (
                <p className="py-6 text-[14px] text-fg-dim">No releases yet.</p>
              ) : (
                <ReleaseList releases={releases} showProduct={false} />
              )}
            </div>
          </section>
        ))}
      </div>
    </Shell>
  );
}
