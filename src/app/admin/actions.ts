"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE, adminSeal, requireAdmin, safeEqual } from "@/lib/admin";
import {
  deleteComment,
  insertComment,
  insertEntry,
  insertRelease,
  isUniqueViolation,
  shipReport,
  updateComment,
  updateReportStatus,
} from "@/lib/queries";
import { getSql } from "@/lib/db";
import { isTeam, TRIAGE_STATUSES } from "@/lib/types";
import { cleanDay, cleanKind, cleanNote, cleanProduct, cleanText, cleanVersion, isFieldError } from "@/lib/validate";

const ADMIN_PATHS = new Set(["/admin", "/admin/accepted", "/admin/fixed", "/admin/closed", "/admin/versions"]);

function refresh(reportId?: string) {
  revalidatePath("/");
  revalidatePath("/versions");
  revalidatePath("/requests");
  for (const path of ADMIN_PATHS) revalidatePath(path);
  if (reportId && isUuid(reportId)) {
    revalidatePath(`/admin/reports/${reportId}`);
    revalidatePath(`/requests/${reportId}`);
  }
}

function safeAdminPath(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  if (value.includes("?") || value.includes("#") || value.includes("\\") || value.includes("//")) return null;
  if (ADMIN_PATHS.has(value)) return value;
  const match = /^\/admin\/reports\/([0-9a-f-]{36})$/i.exec(value);
  if (match && isUuid(match[1])) return `/admin/reports/${match[1]}`;
  return null;
}

function go(formData: FormData, fallback: string, key: "saved" | "error", value: string): never {
  const next = safeAdminPath(formData.get("next")) ?? fallback;
  redirect(`${next}?${key}=${value}`);
}

export async function login(formData: FormData) {
  const secret = process.env.ADMIN_TOKEN;
  const given = formData.get("token");
  const teamRaw = formData.get("team");
  if (!secret || typeof given !== "string" || !safeEqual(given, secret) || typeof teamRaw !== "string" || !isTeam(teamRaw)) {
    redirect("/admin/login?error=1");
  }
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, adminSeal(secret, teamRaw), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  redirect("/admin");
}

export async function logout() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

export async function createRelease(formData: FormData) {
  await requireAdmin();
  const productId = cleanProduct(formData.get("productId"));
  const version = cleanVersion(formData.get("version"));
  const releasedOn = cleanDay(formData.get("releasedOn"));
  const summaryRaw = formData.get("summary");
  const summary = typeof summaryRaw === "string" ? summaryRaw.trim().slice(0, 500) : "";
  if (isFieldError(productId) || isFieldError(version) || isFieldError(releasedOn)) {
    go(formData, "/admin/versions", "error", "invalid");
  }
  try {
    await insertRelease({ productId, version, releasedOn, summary });
  } catch (error) {
    if (isUniqueViolation(error)) go(formData, "/admin/versions", "error", "exists");
    throw error;
  }
  refresh();
  go(formData, "/admin/versions", "saved", "release");
}

export async function addEntry(formData: FormData) {
  await requireAdmin();
  const releaseId = formData.get("releaseId");
  const kind = cleanKind(formData.get("kind"));
  const title = cleanText(formData.get("title"), 180);
  const bodyRaw = formData.get("body");
  const body = typeof bodyRaw === "string" ? bodyRaw.trim().slice(0, 4000) : "";
  if (typeof releaseId !== "string" || !isUuid(releaseId) || isFieldError(kind) || isFieldError(title)) {
    go(formData, "/admin/versions", "error", "invalid");
  }
  const sql = getSql();
  const found = await sql<{ id: string }[]>`SELECT id FROM releases WHERE id = ${releaseId}::uuid`;
  if (!found[0]) go(formData, "/admin/versions", "error", "invalid");
  await insertEntry({ releaseId, kind, title, body });
  refresh();
  go(formData, "/admin/versions", "saved", "entry");
}

export async function addComment(formData: FormData) {
  const team = await requireAdmin();
  const id = formData.get("reportId");
  const body = cleanNote(formData.get("body"));
  if (typeof id !== "string" || !isUuid(id) || isFieldError(body)) {
    go(formData, typeof id === "string" && isUuid(id) ? `/admin/reports/${id}` : "/admin", "error", "reply");
  }
  const sql = getSql();
  const found = await sql<{ id: string }[]>`SELECT id FROM reports WHERE id = ${id}::uuid`;
  if (!found[0]) go(formData, "/admin", "error", "invalid");
  await insertComment({ reportId: id, team, body });
  refresh(id);
  go(formData, `/admin/reports/${id}`, "saved", "comment");
}

export async function editComment(formData: FormData) {
  await requireAdmin();
  const reportId = formData.get("reportId");
  const commentId = formData.get("commentId");
  const body = cleanNote(formData.get("body"));
  const back =
    typeof reportId === "string" && isUuid(reportId) ? `/admin/reports/${reportId}` : "/admin";
  if (typeof reportId !== "string" || !isUuid(reportId) || typeof commentId !== "string" || !isUuid(commentId) || isFieldError(body)) {
    go(formData, back, "error", "reply");
  }
  const saved = await updateComment({ id: commentId, reportId, body });
  if (!saved) go(formData, back, "error", "invalid");
  refresh(reportId);
  go(formData, back, "saved", "edited");
}

export async function removeComment(formData: FormData) {
  await requireAdmin();
  const reportId = formData.get("reportId");
  const commentId = formData.get("commentId");
  const back =
    typeof reportId === "string" && isUuid(reportId) ? `/admin/reports/${reportId}` : "/admin";
  if (typeof reportId !== "string" || !isUuid(reportId) || typeof commentId !== "string" || !isUuid(commentId)) {
    go(formData, back, "error", "invalid");
  }
  const removed = await deleteComment({ id: commentId, reportId });
  if (!removed) go(formData, back, "error", "invalid");
  refresh(reportId);
  go(formData, back, "saved", "deleted");
}

export async function setReportStatus(formData: FormData) {
  await requireAdmin();
  const id = formData.get("reportId");
  const status = formData.get("status");
  if (typeof id !== "string" || !isUuid(id) || typeof status !== "string" || !(TRIAGE_STATUSES as readonly string[]).includes(status)) {
    go(formData, "/admin", "error", "invalid");
  }
  await updateReportStatus(id, status);
  refresh(id);
  go(formData, `/admin/reports/${id}`, "saved", "status");
}

export async function publishReport(formData: FormData) {
  await requireAdmin();
  const reportId = formData.get("reportId");
  const kind = cleanKind(formData.get("kind"));
  const title = cleanText(formData.get("title"), 180);
  const bodyRaw = formData.get("body");
  const body = typeof bodyRaw === "string" ? bodyRaw.trim().slice(0, 4000) : "";
  if (typeof reportId !== "string" || !isUuid(reportId) || isFieldError(kind) || isFieldError(title)) {
    go(formData, "/admin", "error", "invalid");
  }

  const sql = getSql();
  const reports = await sql<{ product_id: string; status: string }[]>`
    SELECT product_id, status FROM reports WHERE id = ${reportId}::uuid
  `;
  const report = reports[0];
  if (!report || report.status === "shipped" || report.status === "spam") {
    go(formData, `/admin/reports/${reportId}`, "error", "invalid");
  }
  if (report.status === "new" || report.status === "declined") {
    go(formData, `/admin/reports/${reportId}`, "error", "notready");
  }

  let releaseId = typeof formData.get("releaseId") === "string" ? String(formData.get("releaseId")) : "";
  if (releaseId && !isUuid(releaseId)) go(formData, `/admin/reports/${reportId}`, "error", "invalid");
  if (!releaseId) {
    const version = cleanVersion(formData.get("version"));
    const releasedOn = cleanDay(formData.get("releasedOn"));
    const summaryRaw = formData.get("summary");
    const summary = typeof summaryRaw === "string" ? summaryRaw.trim().slice(0, 500) : "";
    if (isFieldError(version) || isFieldError(releasedOn)) {
      go(formData, `/admin/reports/${reportId}`, "error", "invalid");
    }
    try {
      releaseId = await insertRelease({
        productId: report.product_id,
        version,
        releasedOn,
        summary,
      });
    } catch (error) {
      if (isUniqueViolation(error)) go(formData, `/admin/reports/${reportId}`, "error", "exists");
      throw error;
    }
  }

  try {
    await shipReport({ reportId, releaseId, kind, title, body });
  } catch (error) {
    if (isUniqueViolation(error)) go(formData, `/admin/reports/${reportId}`, "error", "exists");
    throw error;
  }
  refresh(reportId);
  go(formData, `/admin/reports/${reportId}`, "saved", "shipped");
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
