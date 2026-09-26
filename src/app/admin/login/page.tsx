import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { adminSession } from "@/lib/admin";
import { login } from "../actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await adminSession();
  if (session === "ok") redirect("/admin");
  const query = await searchParams;
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-5 py-16">
      <div className="flex items-center gap-3">
        <Logo size={32} />
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-dim">Zunia</p>
          <h1 className="mt-1 text-[28px] font-medium leading-none tracking-[-0.04em]">Admin</h1>
        </div>
      </div>
      {session === "access" ? (
        <p className="mt-6 text-[15px] leading-relaxed text-fg-muted">
          This page is only available through Cloudflare Access.
        </p>
      ) : session === "unconfigured" ? (
        <p className="mt-6 text-[15px] leading-relaxed text-fg-muted">Set ADMIN_TOKEN before signing in.</p>
      ) : (
        <form action={login} className="mt-8 flex flex-col gap-4">
          {query.error ? <p className="text-[14px] text-[var(--z-danger)]">That token was refused.</p> : null}
          <label className="flex flex-col gap-2 text-[14px]">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-dim">Token</span>
            <input
              name="token"
              type="password"
              autoComplete="current-password"
              required
              className="rounded-[12px] border border-[var(--z-line)] bg-[var(--z-surface)] px-3 py-3 text-fg"
            />
          </label>
          <button type="submit" className="rounded-full bg-[var(--z-button)] px-4 py-2 text-[13px] text-[var(--z-button-fg)]">
            Continue
          </button>
        </form>
      )}
    </div>
  );
}
