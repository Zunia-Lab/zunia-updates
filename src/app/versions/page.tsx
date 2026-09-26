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
      <div className="mt-8 flex flex-col gap-10">
        {groups.map(({ product, releases }) => (
          <section key={product.id} aria-labelledby={`product-${product.id}`}>
            <h2 id={`product-${product.id}`} className="text-[18px] font-medium tracking-[-0.03em]">
              {product.name}
            </h2>
            <div className="mt-4">
              <ReleaseList releases={releases} />
            </div>
          </section>
        ))}
      </div>
    </Shell>
  );
}
