export const PRODUCTS = ["extension", "mobile", "wallet", "website"] as const;
export const KINDS = ["added", "fixed", "changed", "security"] as const;
export const REPORT_TYPES = ["bug", "feature"] as const;
export const BOARD_STATUSES = ["accepted", "planned", "in_progress", "shipped"] as const;
export const TRIAGE_STATUSES = ["accepted", "planned", "in_progress", "declined", "spam"] as const;

export type ProductId = (typeof PRODUCTS)[number];
export type Kind = (typeof KINDS)[number];
export type ReportType = (typeof REPORT_TYPES)[number];
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
};

export function isProductId(value: string): value is ProductId {
  return (PRODUCTS as readonly string[]).includes(value);
}

export function isKind(value: string): value is Kind {
  return (KINDS as readonly string[]).includes(value);
}

export function isReportType(value: string): value is ReportType {
  return (REPORT_TYPES as readonly string[]).includes(value);
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

export function statusLabel(status: ReportStatus): string {
  if (status === "in_progress") return "In progress";
  return status.slice(0, 1).toUpperCase() + status.slice(1);
}
