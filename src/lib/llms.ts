/**
 * /llms.txt (llmstxt.org): what this site publishes, for assistants and the
 * crawlers that feed them. Served by src/app/llms.txt/route.ts.
 *
 * Facts come from the same source as the pages, so a claim cannot drift: the
 * name, summary, sections and outside links are lib/site.ts (the layout and
 * the header and footer read them too), the entry kinds, report statuses and
 * team names are lib/types.ts, and the latest release of each product is read
 * the way the changelog reads it (lib/queries.ts `listLatestReleases`).
 *
 * Releases are public once written; nothing from reports is read, and the
 * team desk is never named. With no database answer, `latest` is null and the
 * file is the static part alone. Pure, so it can be checked without a database.
 */

import { listHref } from "@/lib/paging";
import { LINKS, REPORT, SECTIONS, SITE_DESCRIPTION, SITE_NAME, SITE_URL, type SectionId } from "@/lib/site";
import {
  KINDS,
  PUBLIC_STATUSES,
  TEAMS,
  kindLabel,
  releaseLabel,
  statusLabel,
  teamLabel,
  type LatestReleaseView,
} from "@/lib/types";

/** The rest of Zunia, for assistants. The docs host builds its llms.txt and serves the MCP server (zunia-docs). */
export const ZUNIA_LINKS = {
  websiteLlms: `${LINKS.website}/llms.txt`,
  docsLlms: `${LINKS.docs}/llms.txt`,
  mcp: `${LINKS.docs}/mcp`,
  /** Page paths on the docs host carry their trailing slash; without it the host answers a 301. */
  mcpSetup: `${LINKS.docs}/docs/get-started/ai/`,
} as const;

/** What each section holds, for a reader who has not opened it. */
const SECTION_NOTES: Readonly<Record<SectionId, string>> = {
  changelog: "Every release of every product, newest first, with its notes",
  versions: "Each product's releases, with their versions",
  requests: "Accepted bug reports and feature requests, with their status, the replies, and the version that fixed them",
};

/** "a, b and c"; "a, b or c" with `last` set to "or". */
function join(words: readonly string[], last: "and" | "or" = "and"): string {
  if (words.length < 2) return words.join("");
  return `${words.slice(0, -1).join(", ")} ${last} ${words[words.length - 1]}`;
}

/** An absolute address on this site. */
function onSite(path: string): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

/** One line of text, whatever the summary's own line breaks. */
function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function day(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/** A product's newest release, linked to that product's changelog. */
function latestLine({ product, release }: LatestReleaseView): string {
  const href = onSite(listHref("/", { product: product.id }));
  if (!release) return `- [${product.name}](${href}): No releases yet`;
  const summary = oneLine(release.summary);
  return `- [${releaseLabel(product.name, release.version)}](${href}): Released ${day(release.releasedOn)}${summary ? `. ${summary}` : ""}`;
}

/**
 * The text served at /llms.txt. `latest`: every product with its newest
 * release, or null when the database could not be read.
 */
export function llmsTxt(latest: readonly LatestReleaseView[] | null): string {
  const host = new URL(SITE_URL).host;
  const kinds = join(KINDS.map(kindLabel), "or");
  const statuses = join(PUBLIC_STATUSES.map(statusLabel), "or");
  const teams = join(TEAMS.map(teamLabel));
  const fixed = statusLabel("shipped");
  const sections = SECTIONS.map((section) => `- [${section.label}](${onSite(section.href)}): ${SECTION_NOTES[section.id]}`);

  const releases =
    latest && latest.length > 0 ? `\n## Latest releases\n\n${latest.map(latestLine).join("\n")}\n` : "";

  return `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

${host} is where Zunia Lab publishes what shipped in each Zunia product. Each release is written by Zunia Lab: a product, a version, a date, a summary, and notes marked ${kinds}. A release does not have to start as a report. When a report is fixed, its note joins a release and the report names that version.

Anyone can send a bug report or a feature request, without an account. A report stays private until Zunia Lab accepts it. Accepted reports are listed on Reviews with their status (${statuses}) and the replies of the ${teams} teams.

## Sections

${sections.join("\n")}
- [${REPORT.label}](${onSite(REPORT.href)}): Send a bug report or a feature request. It stays private until accepted
${releases}
## Zunia

- [Website](${LINKS.website}): Zunia, its downloads and support
- [Website llms.txt](${ZUNIA_LINKS.websiteLlms}): Facts about Zunia as a whole
- [Documentation](${LINKS.docs}): Guides, chain list, and integration reference
- [Docs llms.txt](${ZUNIA_LINKS.docsLlms}): Every docs page, each also as Markdown
- [Zunia MCP server](${ZUNIA_LINKS.mcpSetup}): ${ZUNIA_LINKS.mcp}, Streamable HTTP, no key. Read-only: searches the docs and returns integration guides, package versions and chain data to a coding assistant
- [Security](${LINKS.security}): Keys, threat model, and what is still planned
- [GitHub](${LINKS.github}): Source code

## Do not cite

- A bug report or a feature request as a shipped change. Only a report marked ${fixed} names the release that shipped it.
- The text of a report as a statement by Zunia Lab. People who send reports write them; replies from Zunia Lab carry the team name, ${join(TEAMS.map(teamLabel), "or")}.
- Anyone who asks for a recovery phrase, a private key, or a password. The report form says never to include one.
`;
}
