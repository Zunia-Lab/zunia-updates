import type postgres from "postgres";
import { getSql } from "./db";
import type { EntryView, Kind, ProductView, ReleaseView, ReportStatus, ReportType, ReportView } from "./types";

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

export async function listReleasesByProduct(): Promise<{ product: ProductView; releases: ReleaseView[] }[]> {
  const [products, releases] = await Promise.all([listProducts(), listReleases()]);
  return products.map((product) => ({
    product,
    releases: releases.filter((release) => release.productId === product.id),
  }));
}

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
};

function mapReport(row: ReportRow): ReportView {
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
    version: row.version,
  };
}

const reportSelect = `
  SELECT r.id, r.type, r.title, r.body, r.contact, r.status, r.created_at,
         p.id AS product_id, p.name AS product_name, rel.version
  FROM reports r
  JOIN products p ON p.id = r.product_id
  LEFT JOIN changelog_entries e ON e.report_id = r.id
  LEFT JOIN releases rel ON rel.id = e.release_id
`;

export async function listPublicReports(): Promise<ReportView[]> {
  const sql = getSql();
  const rows = await sql.unsafe<ReportRow[]>(
    `${reportSelect}
     WHERE r.status IN ('accepted', 'planned', 'in_progress', 'shipped')
     ORDER BY r.created_at DESC`,
  );
  return rows.map(mapReport);
}

export async function listInbox(): Promise<ReportView[]> {
  const sql = getSql();
  const rows = await sql.unsafe<ReportRow[]>(`${reportSelect} ORDER BY r.created_at DESC`);
  return rows.map(mapReport);
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

export function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}
