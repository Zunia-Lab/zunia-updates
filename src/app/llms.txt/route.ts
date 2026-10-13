import { llmsTxt } from "@/lib/llms";
import { listLatestReleases } from "@/lib/queries";
import type { LatestReleaseView } from "@/lib/types";

/**
 * GET /llms.txt: the site described for assistants (src/lib/llms.ts), with
 * the newest release of each product read at request time, like the pages.
 *
 * Never fails for want of a database: with no answer within the budget (no
 * DATABASE_URL, a refused connection, a stalled one), it serves the static
 * part alone, for a shorter time. robots.txt leaves it crawlable; only /admin
 * is disallowed.
 */
export const dynamic = "force-dynamic";

/** How long the release query may take before the file goes out without it. */
const DATABASE_BUDGET_MS = 2_500;

async function latestReleases(): Promise<LatestReleaseView[] | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`no answer within ${DATABASE_BUDGET_MS} ms`)), DATABASE_BUDGET_MS);
  });
  try {
    return await Promise.race([listLatestReleases(), timeout]);
  } catch (error) {
    console.warn(`llms.txt: served without the latest releases (${error instanceof Error ? error.message : "unknown error"})`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  const latest = await latestReleases();
  return new Response(llmsTxt(latest), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": latest ? "public, max-age=300" : "public, max-age=60",
    },
  });
}
