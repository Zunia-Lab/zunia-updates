import { cache } from "react";
import type postgres from "postgres";
import { getSql } from "./db";
import { pageOf, RELEASE_PAGE_SIZE, REVIEW_PAGE_SIZE, type PageResult } from "./paging";
import {
  isKind,
  PUBLIC_STATUSES,
  type CommentView,
  type EntryView,
  type FixView,
  type Kind,
  type ProductView,
  type ReleaseView,
  type ReportStatus,
  type ReportType,
  type ReportView,
  type Team,
} from "./types";

type ReleaseRow = {
  id: string;
  product_id: string;
  product_name: string;
  version: string;
  released_on: Date;
  summary: string;
  entry_id: string | null;
  kind: Kind | null;
  title: string | null;
  body: string | null;
};

function groupReleases(rows: ReleaseRow[]): ReleaseView[] {
  const releases: ReleaseView[] = [];
  const index = new Map<string, ReleaseView>();
  for (const row of rows) {
    let release = index.get(row.id);
    if (!release) {
      release = {
        id: row.id,
        productId: row.product_id,
        productName: row.product_name,
        version: row.version,
        releasedOn: row.released_on,
        summary: row.summary,
        entries: [],
      };
      index.set(row.id, release);
      releases.push(release);
    }
    if (row.entry_id && row.kind && row.title) {
      const entry: EntryView = { id: row.entry_id, kind: row.kind, title: row.title, body: row.body ?? "" };
      release.entries.push(entry);
    }
  }
  return releases;
}

const releaseSelect = `
  SELECT r.id, r.version, r.released_on, r.summary,
         p.id AS product_id, p.name AS product_name,
         e.id AS entry_id, e.kind, e.title, e.body
  FROM releases r
  JOIN products p ON p.id = r.product_id
  LEFT JOIN changelog_entries e ON e.release_id = r.id
`;

export async function listProducts(): Promise<ProductView[]> {
  const sql = getSql();
  const rows = await sql<{ id: string; name: string }[]>`
    SELECT id, name FROM products ORDER BY sort
  `;
  return rows.map((row) => ({ id: row.id, name: row.name }));
}

export async function listReleases(productId?: string): Promise<ReleaseView[]> {
  const sql = getSql();
  const rows = productId
    ? await sql.unsafe<ReleaseRow[]>(
        `${releaseSelect} WHERE p.id = $1 ORDER BY r.released_on DESC, r.created_at DESC, e.created_at ASC`,
        [productId],
      )
    : await sql.unsafe<ReleaseRow[]>(
        `${releaseSelect} ORDER BY r.released_on DESC, r.created_at DESC, e.created_at ASC`,
      );
  return groupReleases(rows);
}

export const listReleasePage = cache(async function listReleasePage(
  productId: string | null,
  page: number,
): Promise<PageResult<ReleaseView>> {
  const sql = getSql();
  const counted = await sql<{ count: number }[]>`
    SELECT count(*)::int AS count
    FROM releases r
    WHERE (${productId}::text IS NULL OR r.product_id = ${productId})
  `;
  const meta = pageOf(Number(counted[0]?.count ?? 0), page, RELEASE_PAGE_SIZE);
  if (meta.total === 0) return { ...meta, items: [] };
  const ids = await sql<{ id: string }[]>`
    SELECT r.id
    FROM releases r
    WHERE (${productId}::text IS NULL OR r.product_id = ${productId})
    ORDER BY r.released_on DESC, r.created_at DESC
    LIMIT ${RELEASE_PAGE_SIZE} OFFSET ${(meta.page - 1) * RELEASE_PAGE_SIZE}
  `;
  const idList = ids.map((row) => row.id);
  if (idList.length === 0) return { ...meta, items: [] };
  const rows = await sql<ReleaseRow[]>`
    SELECT r.id, r.version, r.released_on, r.summary,
           p.id AS product_id, p.name AS product_name,
           e.id AS entry_id, e.kind, e.title, e.body
    FROM releases r
    JOIN products p ON p.id = r.product_id
    LEFT JOIN changelog_entries e ON e.release_id = r.id
    WHERE r.id = ANY(${idList}::uuid[])
    ORDER BY r.released_on DESC, r.created_at DESC, e.created_at ASC
  `;
  return { ...meta, items: groupReleases(rows) };
});

type ReportRow = {
  id: string;
  type: ReportType;
  product_id: string;
  product_name: string;
  title: string;
  body: string;
  contact: string | null;
  status: ReportStatus;
  created_at: Date;
  version: string | null;
  released_on: Date | string | null;
  release_summary: string | null;
  fix_kind: Kind | null;
  fix_title: string | null;
  fix_body: string | null;
};

function mapFix(row: ReportRow): FixView | null {
  if (!row.version || !row.fix_title || !row.fix_kind || !isKind(row.fix_kind) || !row.released_on) return null;
  return {
    kind: row.fix_kind,
    title: row.fix_title,
    body: row.fix_body ?? "",
    version: row.version,
    releasedOn: row.released_on instanceof Date ? row.released_on : new Date(`${row.released_on}T00:00:00Z`),
    summary: row.release_summary ?? "",
  };
}

function mapReport(row: ReportRow): ReportView {
  const fix = mapFix(row);
  return {
    id: row.id,
    type: row.type,
    productId: row.product_id,
    productName: row.product_name,
    title: row.title,
    body: row.body,
    contact: row.contact,
    status: row.status,
    createdAt: row.created_at,
    version: fix?.version ?? row.version,
    fix,
    comments: [],
  };
}

async function attachComments(reports: ReportView[]): Promise<ReportView[]> {
  if (reports.length === 0) return reports;
  const sql = getSql();
  const ids = reports.map((report) => report.id);
  const rows = await sql<{ id: string; report_id: string; team: Team; body: string; created_at: Date }[]>`
    SELECT id, report_id, team, body, created_at
    FROM report_comments
    WHERE report_id = ANY(${ids}::uuid[])
    ORDER BY created_at ASC
  `;
  const byReport = new Map<string, CommentView[]>();
  for (const row of rows) {
    const comment: CommentView = {
      id: row.id,
      reportId: row.report_id,
      team: row.team,
      body: row.body,
      createdAt: row.created_at,
    };
    const list = byReport.get(row.report_id) ?? [];
    list.push(comment);
    byReport.set(row.report_id, list);
  }
  return reports.map((report) => ({ ...report, comments: byReport.get(report.id) ?? [] }));
}

const reportSelect = `
  SELECT r.id, r.type, r.title, r.body, r.contact, r.status, r.created_at,
         p.id AS product_id, p.name AS product_name,
         rel.version, rel.released_on, rel.summary AS release_summary,
         e.kind AS fix_kind, e.title AS fix_title, e.body AS fix_body
  FROM reports r
  JOIN products p ON p.id = r.product_id
  LEFT JOIN changelog_entries e ON e.report_id = r.id
  LEFT JOIN releases rel ON rel.id = e.release_id
`;

const PUBLIC_STATUS_SQL = `'accepted', 'planned', 'in_progress', 'shipped'`;

async function reportPage(input: {
  statuses: readonly ReportStatus[];
  type: ReportType | null;
  productId: string | null;
  page: number;
}): Promise<PageResult<ReportView>> {
  const sql = getSql();
  const counted = await sql<{ count: number }[]>`
    SELECT count(*)::int AS count
    FROM reports r
    WHERE r.status IN ${sql(input.statuses)}
      AND (${input.type}::text IS NULL OR r.type = ${input.type})
      AND (${input.productId}::text IS NULL OR r.product_id = ${input.productId})
  `;
  const meta = pageOf(Number(counted[0]?.count ?? 0), input.page, REVIEW_PAGE_SIZE);
  if (meta.total === 0) return { ...meta, items: [] };
  const rows = await sql<ReportRow[]>`
    SELECT r.id, r.type, r.title, r.body, r.contact, r.status, r.created_at,
           p.id AS product_id, p.name AS product_name,
           rel.version, rel.released_on, rel.summary AS release_summary,
           e.kind AS fix_kind, e.title AS fix_title, e.body AS fix_body
    FROM reports r
    JOIN products p ON p.id = r.product_id
    LEFT JOIN changelog_entries e ON e.report_id = r.id
    LEFT JOIN releases rel ON rel.id = e.release_id
    WHERE r.status IN ${sql(input.statuses)}
      AND (${input.type}::text IS NULL OR r.type = ${input.type})
      AND (${input.productId}::text IS NULL OR r.product_id = ${input.productId})
    ORDER BY r.created_at DESC
    LIMIT ${REVIEW_PAGE_SIZE} OFFSET ${(meta.page - 1) * REVIEW_PAGE_SIZE}
  `;
  return { ...meta, items: await attachComments(rows.map(mapReport)) };
}

export const listPublicReports = cache(async function listPublicReports(
  type: ReportType | null,
  productId: string | null,
  page: number,
): Promise<PageResult<ReportView>> {
  return reportPage({ statuses: PUBLIC_STATUSES, type, productId, page });
});

export async function getPublicReport(id: string): Promise<ReportView | null> {
  if (!isUuid(id)) return null;
  const sql = getSql();
  const rows = await sql.unsafe<ReportRow[]>(
    `${reportSelect} WHERE r.id = $1::uuid AND r.status IN (${PUBLIC_STATUS_SQL})`,
    [id],
  );
  const report = rows[0] ? mapReport(rows[0]) : null;
  if (!report) return null;
  const [withComments] = await attachComments([report]);
  return withComments;
}

export async function getReport(id: string): Promise<ReportView | null> {
  if (!isUuid(id)) return null;
  const sql = getSql();
  const rows = await sql.unsafe<ReportRow[]>(`${reportSelect} WHERE r.id = $1::uuid`, [id]);
  const report = rows[0] ? mapReport(rows[0]) : null;
  if (!report) return null;
  const [withComments] = await attachComments([report]);
  return withComments;
}

export type ReportQueue = "review" | "accepted" | "fixed" | "closed";

const QUEUE_STATUSES: Record<ReportQueue, ReportStatus[]> = {
  review: ["new"],
  accepted: ["accepted", "planned", "in_progress"],
  fixed: ["shipped"],
  closed: ["declined", "spam"],
};

export function queueStatuses(queue: ReportQueue): ReportStatus[] {
  return QUEUE_STATUSES[queue];
}

export const listQueue = cache(async function listQueue(
  queue: ReportQueue,
  type: ReportType | null,
  productId: string | null,
  page: number,
): Promise<PageResult<ReportView>> {
  return reportPage({ statuses: queueStatuses(queue), type, productId, page });
});

export type QueueCounts = Record<ReportQueue, number>;

export async function queueCounts(): Promise<QueueCounts> {
  const sql = getSql();
  const rows = await sql<{ status: ReportStatus; count: string }[]>`
    SELECT status, count(*)::text AS count FROM reports GROUP BY status
  `;
  const count = (status: ReportStatus) => Number(rows.find((row) => row.status === status)?.count ?? 0);
  return {
    review: count("new"),
    accepted: count("accepted") + count("planned") + count("in_progress"),
    fixed: count("shipped"),
    closed: count("declined") + count("spam"),
  };
}

export async function recentReportCount(ipHash: string): Promise<number> {
  const sql = getSql();
  const rows = await sql<{ count: string }[]>`
    SELECT count(*)::text AS count
    FROM reports
    WHERE ip_hash = ${ipHash}
      AND created_at > now() - interval '1 hour'
  `;
  return Number(rows[0]?.count ?? 0);
}

export async function insertComment(input: { reportId: string; team: Team; body: string }): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO report_comments (report_id, team, body)
    VALUES (${input.reportId}::uuid, ${input.team}, ${input.body})
  `;
}

export async function updateComment(input: { id: string; reportId: string; body: string }): Promise<boolean> {
  const sql = getSql();
  const rows = await sql<{ id: string }[]>`
    UPDATE report_comments
    SET body = ${input.body}
    WHERE id = ${input.id}::uuid
      AND report_id = ${input.reportId}::uuid
    RETURNING id
  `;
  return Boolean(rows[0]);
}

export async function deleteComment(input: { id: string; reportId: string }): Promise<boolean> {
  const sql = getSql();
  const rows = await sql<{ id: string }[]>`
    DELETE FROM report_comments
    WHERE id = ${input.id}::uuid
      AND report_id = ${input.reportId}::uuid
    RETURNING id
  `;
  return Boolean(rows[0]);
}

export async function insertReport(input: {
  type: ReportType;
  productId: string;
  title: string;
  body: string;
  contact: string | null;
  ipHash: string;
}): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO reports (type, product_id, title, body, contact, ip_hash)
    VALUES (${input.type}, ${input.productId}, ${input.title}, ${input.body}, ${input.contact}, ${input.ipHash})
  `;
}

export async function insertRelease(input: {
  productId: string;
  version: string;
  releasedOn: string;
  summary: string;
}): Promise<string> {
  const sql = getSql();
  const rows = await sql<{ id: string }[]>`
    INSERT INTO releases (product_id, version, released_on, summary)
    VALUES (${input.productId}, ${input.version}, ${input.releasedOn}, ${input.summary})
    RETURNING id
  `;
  return rows[0].id;
}

export async function insertEntry(input: {
  releaseId: string;
  kind: string;
  title: string;
  body: string;
  reportId?: string | null;
}): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO changelog_entries (release_id, kind, title, body, report_id)
    VALUES (${input.releaseId}, ${input.kind}, ${input.title}, ${input.body}, ${input.reportId ?? null})
  `;
}

export async function updateReportStatus(id: string, status: string): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE reports
    SET status = ${status}
    WHERE id = ${id}::uuid
      AND status <> 'shipped'
  `;
}

export async function shipReport(input: {
  reportId: string;
  releaseId: string;
  kind: string;
  title: string;
  body: string;
}): Promise<void> {
  const sql = getSql();
  await sql.begin(async (tx: postgres.TransactionSql) => {
    const reports = await tx<{ id: string; status: string }[]>`
      SELECT id, status FROM reports WHERE id = ${input.reportId}::uuid FOR UPDATE
    `;
    const report = reports[0];
    if (!report || report.status === "shipped" || report.status === "spam") return;
    await tx`
      INSERT INTO changelog_entries (release_id, kind, title, body, report_id)
      VALUES (${input.releaseId}::uuid, ${input.kind}, ${input.title}, ${input.body}, ${input.reportId}::uuid)
    `;
    await tx`UPDATE reports SET status = 'shipped' WHERE id = ${input.reportId}::uuid`;
  });
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}
