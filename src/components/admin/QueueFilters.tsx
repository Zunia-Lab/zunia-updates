import Link from "next/link";
import { listHref } from "@/lib/paging";
import type { ProductView, ReportType } from "@/lib/types";

export function QueueFilters({
  href,
  type,
  productId,
  products,
}: {
  href: string;
  type?: ReportType;
  productId?: string;
  products: ProductView[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        <FilterLink href={query(href, undefined, productId)} current={!type}>
          All
        </FilterLink>
        <FilterLink href={query(href, "bug", productId)} current={type === "bug"}>
          Bugs
        </FilterLink>
        <FilterLink href={query(href, "feature", productId)} current={type === "feature"}>
          Features
        </FilterLink>
      </div>
      <div className="flex flex-wrap gap-1">
        <FilterLink href={query(href, type, undefined)} current={!productId}>
          All products
        </FilterLink>
        {products.map((product) => (
          <FilterLink key={product.id} href={query(href, type, product.id)} current={productId === product.id}>
            {product.name}
          </FilterLink>
        ))}
      </div>
    </div>
  );
}

function query(href: string, type?: string, productId?: string) {
  return listHref(href, { type, product: productId });
}

function FilterLink({ href, current, children }: { href: string; current: boolean; children: string }) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={
        current
          ? "rounded-full bg-[var(--z-state-hover)] px-3 py-1 text-[13px] text-fg"
          : "rounded-full px-3 py-1 text-[13px] text-fg-muted hover:bg-[var(--z-state-hover)] hover:text-fg"
      }
    >
      {children}
    </Link>
  );
}
