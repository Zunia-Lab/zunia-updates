import Link from "next/link";
import { Shell } from "@/components/Shell";
import { Turnstile } from "@/components/Turnstile";
import { listProducts } from "@/lib/queries";
import { turnstileSiteKey } from "@/lib/turnstile";
import { submitReport } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Report" };

const ERRORS: Record<string, string> = {
  invalid: "Check the fields and try again. A report needs a title and at least a short description.",
  rate: "Too many reports from this network. Try again in an hour.",
  human: "Human verification failed. Try again.",
};

export default async function NewReportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const query = await searchParams;
  const products = await listProducts();
  const siteKey = turnstileSiteKey();
  const error = query.error ? ERRORS[query.error] : undefined;

  return (
    <Shell active="requests">
      <p className="max-w-xl text-[15px] leading-relaxed text-fg-muted">
        One form for a bug or a feature. Do not include a recovery phrase, a private key, or a password. The report stays private until we accept it.
      </p>
      {query.sent ? (
        <p className="mt-6 rounded-[16px] border border-[var(--z-line)] bg-[var(--z-surface)] px-5 py-4 text-[15px]">
          Sent. We read every report. It appears on the board only after we accept it.
        </p>
      ) : null}
      {error ? <p className="mt-6 text-[14px] text-[var(--z-danger)]">{error}</p> : null}
      <form action={submitReport} className="mt-8 flex flex-col gap-5">
        <fieldset className="flex gap-4 border-0 p-0">
          <legend className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-fg-dim">Type</legend>
          <label className="flex items-center gap-2 text-[14px]">
            <input type="radio" name="type" value="bug" defaultChecked /> Bug
          </label>
          <label className="flex items-center gap-2 text-[14px]">
            <input type="radio" name="type" value="feature" /> Feature
          </label>
        </fieldset>
        <label className="flex flex-col gap-2 text-[14px]">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-dim">Product</span>
          <select
            name="productId"
            required
            className="rounded-[12px] border border-[var(--z-line)] bg-[var(--z-surface)] px-3 py-3 text-fg"
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-[14px]">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-dim">Title</span>
          <input
            name="title"
            required
            maxLength={140}
            className="rounded-[12px] border border-[var(--z-line)] bg-[var(--z-surface)] px-3 py-3 text-fg"
          />
        </label>
        <label className="flex flex-col gap-2 text-[14px]">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-dim">What happened, or what you want</span>
          <textarea
            name="body"
            required
            minLength={10}
            maxLength={4000}
            rows={8}
            placeholder={"Markdown is fine.\n\n- what you expected\n- what happened"}
            className="rounded-[12px] border border-[var(--z-line)] bg-[var(--z-surface)] px-3 py-3 font-mono text-[13px] leading-relaxed text-fg"
          />
        </label>
        <label className="flex flex-col gap-2 text-[14px]">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-dim">Emails, optional</span>
          <input
            name="contact"
            type="text"
            inputMode="email"
            maxLength={1000}
            autoComplete="email"
            placeholder="you@example.com, teammate@example.com"
            className="rounded-[12px] border border-[var(--z-line)] bg-[var(--z-surface)] px-3 py-3 text-fg"
          />
          <span className="text-[12px] text-fg-dim">Separate more than one address with a comma.</span>
        </label>
        <Turnstile siteKey={siteKey} />
        {!siteKey ? <p className="text-[13px] text-[var(--z-danger)]">Human verification is not configured.</p> : null}
        <div className="flex items-center gap-4">
          <button type="submit" className="rounded-full bg-[var(--z-button)] px-4 py-2 text-[13px] text-[var(--z-button-fg)]">
            Send
          </button>
          <Link href="/requests" className="text-[13px] text-fg-dim hover:text-fg">
            Back to requests
          </Link>
        </div>
      </form>
    </Shell>
  );
}
