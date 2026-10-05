import { QueueView } from "@/components/admin/QueueView";

export const dynamic = "force-dynamic";

export const metadata = { title: "Fixed" };

export default function FixedPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; type?: string; product?: string; page?: string }>;
}) {
  return (
    <QueueView
      queue="fixed"
      title="Fixed"
      lede="Shipped reviews. Each row names the product and the version it landed in."
      empty="Nothing fixed yet."
      searchParams={searchParams}
    />
  );
}
