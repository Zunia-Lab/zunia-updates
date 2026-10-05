import { QueueView } from "@/components/admin/QueueView";

export const dynamic = "force-dynamic";

export const metadata = { title: "Closed" };

export default function ClosedPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; type?: string; product?: string; page?: string }>;
}) {
  return (
    <QueueView
      queue="closed"
      title="Closed"
      lede="Declined reports and spam. They stay off Reviews. Open one if you want to accept it later."
      empty="Nothing closed."
      searchParams={searchParams}
    />
  );
}
