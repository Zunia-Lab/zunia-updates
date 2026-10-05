export const PRODUCTS = ["extension", "mobile", "wallet", "website"] as const;
export const KINDS = ["added", "fixed", "changed", "security"] as const;
export const REPORT_TYPES = ["bug", "feature"] as const;
export const TEAMS = ["support", "technical"] as const;
export const BOARD_STATUSES = ["accepted", "planned", "in_progress", "shipped"] as const;
export const TRIAGE_STATUSES = ["accepted", "planned", "in_progress", "declined", "spam"] as const;

export type ProductId = (typeof PRODUCTS)[number];
export type Kind = (typeof KINDS)[number];
export type ReportType = (typeof REPORT_TYPES)[number];
export type Team = (typeof TEAMS)[number];
export type ReportStatus =
  | "new"
  | "accepted"
  | "planned"
  | "in_progress"
  | "shipped"
  | "declined"
  | "spam";

export type EntryView = {
  id: string;
  kind: Kind;
  title: string;
  body: string;
};

export type ReleaseView = {
  id: string;
  productId: string;
  productName: string;
  version: string;
  releasedOn: Date;
  summary: string;
  entries: EntryView[];
};

export type ProductView = {
  id: string;
  name: string;
};

export type CommentView = {
  id: string;
  reportId: string;
  team: Team;
  body: string;
  createdAt: Date;
};

export type FixView = {
  kind: Kind;
  title: string;
  body: string;
  version: string;
  releasedOn: Date;
  summary: string;
};

export type ReportView = {
  id: string;
  type: ReportType;
  productId: string;
  productName: string;
  title: string;
  body: string;
  contact: string | null;
  status: ReportStatus;
  createdAt: Date;
  version: string | null;
  fix: FixView | null;
  comments: CommentView[];
};

export function plainExcerpt(source: string, max = 180): string {
  const plain = source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/[*_>~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  const space = cut.lastIndexOf(" ");
  const end = space > max * 0.6 ? space : max;
  return `${cut.slice(0, end).trim()}...`;
}

export function isProductId(value: string): value is ProductId {
  return (PRODUCTS as readonly string[]).includes(value);
}

export function isKind(value: string): value is Kind {
  return (KINDS as readonly string[]).includes(value);
}

export function isReportType(value: string): value is ReportType {
  return (REPORT_TYPES as readonly string[]).includes(value);
}

export function isTeam(value: string): value is Team {
  return (TEAMS as readonly string[]).includes(value);
}

const DAY = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDay(value: Date): string {
  return DAY.format(value);
}

export function kindLabel(kind: Kind): string {
  if (kind === "added") return "Added";
  if (kind === "fixed") return "Fixed";
  if (kind === "changed") return "Changed";
  return "Security";
}

export const PUBLIC_STATUSES = ["accepted", "planned", "in_progress", "shipped"] as const;

export function isPublicStatus(status: ReportStatus): boolean {
  return (PUBLIC_STATUSES as readonly string[]).includes(status);
}

export function typeLabel(type: ReportType): string {
  return type === "bug" ? "Bug" : "Feature";
}

export function statusLabel(status: ReportStatus): string {
  if (status === "new") return "Needs review";
  if (status === "in_progress") return "In development";
  if (status === "shipped") return "Fixed";
  if (status === "accepted") return "Accepted";
  if (status === "planned") return "Planned";
  if (status === "declined") return "Declined";
  return "Spam";
}

export function waitingForVersion(status: ReportStatus): boolean {
  return status === "accepted" || status === "planned";
}

export function teamLabel(team: Team): string {
  if (team === "support") return "Support";
  return "Technical";
}

export function releaseLabel(productName: string, version: string): string {
  return `${productName} ${version}`;
}
