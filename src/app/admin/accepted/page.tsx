import { QueueView } from "@/components/admin/QueueView";

export const dynamic = "force-dynamic";

export const metadata = { title: "Accepted" };

export default function AcceptedPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; type?: string; product?: string; page?: string }>;
}) {
  return (
    <QueueView
      queue="accepted"
      title="Accepted"
      lede="These titles are already on Reviews. A row that says no version yet still needs a release. Open it, then mark it fixed when that version exists."
      empty="Nothing accepted."
      searchParams={searchParams}
    />
  );
}
