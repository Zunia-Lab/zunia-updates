import { isKind, isProductId, isReportType, type Kind, type ProductId, type ReportType } from "./types";

const VERSION = /^[A-Za-z0-9][A-Za-z0-9._+-]{0,31}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FieldError = "missing" | "invalid" | "long";

export function cleanText(value: FormDataEntryValue | null, max: number): string | FieldError {
  if (typeof value !== "string") return "missing";
  const text = value.trim().replace(/\s+/g, " ");
  if (!text) return "missing";
  if (text.length > max) return "long";
  return text;
}

export function cleanBody(value: FormDataEntryValue | null): string | FieldError {
  if (typeof value !== "string") return "missing";
  const text = value.trim();
  if (text.length < 10) return "missing";
  if (text.length > 4000) return "long";
  return text;
}

export function cleanVersion(value: FormDataEntryValue | null): string | FieldError {
  const text = cleanText(value, 32);
  if (typeof text !== "string") return text;
  if (!VERSION.test(text)) return "invalid";
  return text;
}

export function cleanDay(value: FormDataEntryValue | null): string | FieldError {
  if (typeof value !== "string" || !DAY.test(value)) return "invalid";
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return "invalid";
  return value;
}

export function cleanProduct(value: FormDataEntryValue | null): ProductId | FieldError {
  if (typeof value !== "string" || !isProductId(value)) return "invalid";
  return value;
}

export function cleanKind(value: FormDataEntryValue | null): Kind | FieldError {
  if (typeof value !== "string" || !isKind(value)) return "invalid";
  return value;
}

export function cleanReportType(value: FormDataEntryValue | null): ReportType | FieldError {
  if (typeof value !== "string" || !isReportType(value)) return "invalid";
  return value;
}

export function cleanContact(value: FormDataEntryValue | null): string | null | FieldError {
  if (typeof value !== "string" || !value.trim()) return null;
  const text = value.trim();
  if (text.length > 200 || !EMAIL.test(text)) return "invalid";
  return text;
}

export function fieldMessage(error: FieldError): string {
  if (error === "long") return "That is too long.";
  if (error === "invalid") return "Check the highlighted fields and try again.";
  return "Fill in the required fields.";
}

export function isFieldError(value: unknown): value is FieldError {
  return value === "missing" || value === "invalid" || value === "long";
}
