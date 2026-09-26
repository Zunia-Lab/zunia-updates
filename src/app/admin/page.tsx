import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Markdown } from "@/components/Markdown";
import { requireAdmin } from "@/lib/admin";
import { listInbox, listProducts, listReleases } from "@/lib/queries";
import { KINDS, TRIAGE_STATUSES, formatDay, statusLabel } from "@/lib/types";
import { addEntry, createRelease, logout, publishReport, setReportStatus } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

const NOTICES: Record<string, string> = {
  release: "Release published.",
  entry: "Changelog entry published.",
  status: "Report updated.",
  shipped: "Report shipped into the changelog.",
  invalid: "That form could not be saved.",
  exists: "That version already exists, or this report is already shipped.",
};

const fieldClass = "rounded-[12px] border border-[var(--z-line)] bg-[var(--z-bg)] px-3 py-2 text-[14px] text-fg";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requireAdmin();
  const query = await searchParams;
  const [products, releases, inbox] = await Promise.all([listProducts(), listReleases(), listInbox()]);
  const notice = query.saved ? NOTICES[query.saved] : query.error ? NOTICES[query.error] : undefined;

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo size={32} />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-dim">Zunia</p>
            <h1 className="mt-1 text-[28px] font-medium leading-none tracking-[-0.04em]">Admin</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-[13px] text-fg-dim hover:text-fg">
            Public site
          </Link>
          <form action={logout}>
            <button type="submit" className="text-[13px] text-fg-dim hover:text-fg">
              Sign out
            </button>
          </form>
        </div>
      </header>
      {notice ? <p className="mt-6 text-[14px] text-fg-muted">{notice}</p> : null}

      <section className="mt-10">
        <h2 className="text-[18px] font-medium">Publish a release</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-fg-muted">
          This goes on the changelog and the versions page immediately. No report is required.
        </p>
        <form action={createRelease} className="mt-4 grid gap-3 sm:grid-cols-2">
          <select name="productId" required className={fieldClass}>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <input name="version" required placeholder="0.4.2" className={fieldClass} />
          <input name="releasedOn" required type="date" className={fieldClass} />
          <input name="summary" placeholder="Short summary" className={fieldClass} />
          <button type="submit" className="rounded-full bg-[var(--z-button)] px-4 py-2 text-[13px] text-[var(--z-button-fg)] sm:col-span-2 sm:w-fit">
            Publish release
          </button>
        </form>
      </section>

      <section className="mt-12">
        <h2 className="text-[18px] font-medium">Add a changelog entry</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-fg-muted">
          This entry is not tied to a report.
        </p>
        {releases.length === 0 ? (
          <p className="mt-4 text-[14px] text-fg-dim">Publish a release first.</p>
        ) : (
          <form action={addEntry} className="mt-4 flex flex-col gap-3">
            <select name="releaseId" required className={fieldClass}>
              {releases.map((release) => (
                <option key={release.id} value={release.id}>
                  {release.productName} {release.version}
                </option>
              ))}
            </select>
            <select name="kind" required className={fieldClass}>
              {KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {kind}
                </option>
              ))}
            </select>
            <input name="title" required placeholder="What changed" className={fieldClass} />
            <textarea name="body" rows={3} placeholder="Optional detail" className={fieldClass} />
            <button type="submit" className="w-fit rounded-full bg-[var(--z-button)] px-4 py-2 text-[13px] text-[var(--z-button-fg)]">
              Publish entry
            </button>
          </form>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-[18px] font-medium">Reports</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-fg-muted">
          Accepting a report only puts the title on the public board. Shipping writes a changelog entry you compose here.
        </p>
        {inbox.length === 0 ? (
          <p className="mt-4 text-[14px] text-fg-dim">No reports.</p>
        ) : (
          <ul className="mt-4 flex list-none flex-col gap-4 p-0">
            {inbox.map((report) => (
              <li key={report.id} className="rounded-[16px] border border-[var(--z-line)] bg-[var(--z-surface)] p-5">
                <p className="text-[15px]">{report.title}</p>
                <p className="mt-1 font-mono text-[12px] text-fg-dim">
                  {report.type} · {report.productName} · {statusLabel(report.status)} · {formatDay(report.createdAt)}
                  {report.version ? ` · ${report.version}` : ""}
                </p>
                {report.contact ? <p className="mt-2 text-[13px] text-fg-muted">{report.contact}</p> : null}
                <Markdown source={report.body} />
                {report.status !== "shipped" ? (
                  <div className="mt-4 flex flex-col gap-4">
                    <form action={setReportStatus} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="reportId" value={report.id} />
                      <select name="status" defaultValue={report.status === "new" ? "accepted" : report.status} className={fieldClass}>
                        {TRIAGE_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {statusLabel(status)}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="rounded-full border border-[var(--z-line)] px-3 py-2 text-[13px]">
                        Update status
                      </button>
                    </form>
                    <form action={publishReport} className="grid gap-2 border-t border-[var(--z-line)] pt-4 sm:grid-cols-2">
                      <input type="hidden" name="reportId" value={report.id} />
                      <select name="releaseId" className={`${fieldClass} sm:col-span-2`}>
                        <option value="">New version below</option>
                        {releases
                          .filter((release) => release.productId === report.productId)
                          .map((release) => (
                            <option key={release.id} value={release.id}>
                              {release.productName} {release.version}
                            </option>
                          ))}
                      </select>
                      <input name="version" placeholder="New version" className={fieldClass} />
                      <input name="releasedOn" type="date" className={fieldClass} />
                      <input name="summary" placeholder="Release summary" className={`${fieldClass} sm:col-span-2`} />
                      <select name="kind" required defaultValue="fixed" className={fieldClass}>
                        {KINDS.map((kind) => (
                          <option key={kind} value={kind}>
                            {kind}
                          </option>
                        ))}
                      </select>
                      <input name="title" required defaultValue={report.title} className={fieldClass} />
                      <textarea name="body" rows={3} placeholder="Public note" className={`${fieldClass} sm:col-span-2`} />
                      <button type="submit" className="w-fit rounded-full bg-[var(--z-button)] px-4 py-2 text-[13px] text-[var(--z-button-fg)]">
                        Ship into changelog
                      </button>
                    </form>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
