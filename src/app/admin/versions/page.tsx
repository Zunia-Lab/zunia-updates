import { AdminFrame } from "@/components/admin/AdminFrame";
import { Block, Field, fieldClass } from "@/components/admin/fields";
import { MarkdownField } from "@/components/MarkdownField";
import { addEntry, createRelease } from "@/app/admin/actions";
import { noticeFrom } from "@/lib/notices";
import { listProducts, listReleases } from "@/lib/queries";
import { KINDS, kindLabel, releaseLabel } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Versions" };

export default async function VersionsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const query = await searchParams;
  const [products, releases] = await Promise.all([listProducts(), listReleases()]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <AdminFrame
      active="versions"
      title="Versions"
      lede="Publish a version when it ships, on its own. It does not have to start as a review. To attach a review, open that review after it is accepted and mark it fixed."
      notice={noticeFrom(query)}
    >
      <div className="flex flex-col gap-6">
        <section className="rounded-[16px] border border-[var(--z-line)] bg-[var(--z-surface)] p-5">
          <h2 className="text-[18px] font-medium">Publish a version</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-fg-muted">
            This goes on the changelog and the versions page immediately. The title is the product plus the version, for example Extension 0.1.2.
          </p>
          <form action={createRelease} className="mt-5 grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="next" value="/admin/versions" />
            <Field label="Product">
              <select name="productId" required className={fieldClass}>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Version" hint="Store version, such as 0.1.2">
              <input name="version" required placeholder="0.1.2" className={fieldClass} />
            </Field>
            <Field label="Release date">
              <input name="releasedOn" required type="date" defaultValue={today} className={fieldClass} />
            </Field>
            <Field label="Summary" hint="One line under the version. Plain text.">
              <input name="summary" placeholder="What this version is for" className={fieldClass} />
            </Field>
            <button
              type="submit"
              className="w-fit rounded-full bg-[var(--z-button)] px-4 py-2 text-[13px] text-[var(--z-button-fg)] sm:col-span-2"
            >
              Publish version
            </button>
          </form>
        </section>

        <section className="rounded-[16px] border border-[var(--z-line)] bg-[var(--z-surface)] p-5">
          <h2 className="text-[18px] font-medium">Add a changelog line</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-fg-muted">
            A line inside a version. It does not have to come from a review.
          </p>
          {releases.length === 0 ? (
            <p className="mt-4 text-[14px] text-fg-dim">Publish a version first.</p>
          ) : (
            <form action={addEntry} className="mt-5 flex flex-col gap-4">
              <input type="hidden" name="next" value="/admin/versions" />
              <Field label="Version">
                <select name="releaseId" required className={fieldClass}>
                  {releases.map((release) => (
                    <option key={release.id} value={release.id}>
                      {releaseLabel(release.productName, release.version)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Kind">
                <select name="kind" required defaultValue="fixed" className={fieldClass}>
                  {KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {kindLabel(kind)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Title">
                <input name="title" required placeholder="What changed" className={fieldClass} />
              </Field>
              <Block label="Detail" hint="Optional. Markdown. This is the text under the title.">
                <MarkdownField
                  id="entry-body"
                  required={false}
                  minLength={0}
                  rows={6}
                  placeholder={"The short explanation readers see.\n\n- one concrete change"}
                  hint="Markdown. Leave this empty if the title is enough."
                />
              </Block>
              <button
                type="submit"
                className="w-fit rounded-full bg-[var(--z-button)] px-4 py-2 text-[13px] text-[var(--z-button-fg)]"
              >
                Publish line
              </button>
            </form>
          )}
        </section>
      </div>
    </AdminFrame>
  );
}
