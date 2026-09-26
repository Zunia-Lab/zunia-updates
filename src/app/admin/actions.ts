"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE, adminSeal, requireAdmin, safeEqual } from "@/lib/admin";
import {
  insertEntry,
  insertRelease,
  isUniqueViolation,
  shipReport,
  updateReportStatus,
} from "@/lib/queries";
import { getSql } from "@/lib/db";
import { TRIAGE_STATUSES } from "@/lib/types";
import { cleanDay, cleanKind, cleanProduct, cleanText, cleanVersion, isFieldError } from "@/lib/validate";

function refresh() {
  revalidatePath("/");
  revalidatePath("/versions");
  revalidatePath("/requests");
  revalidatePath("/admin");
}

export async function login(formData: FormData) {
  const secret = process.env.ADMIN_TOKEN;
  const given = formData.get("token");
  if (!secret || typeof given !== "string" || !safeEqual(given, secret)) {
    redirect("/admin/login?error=1");
  }
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, adminSeal(secret), {
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
    redirect("/admin?error=invalid");
  }
  try {
    await insertRelease({ productId, version, releasedOn, summary });
  } catch (error) {
    if (isUniqueViolation(error)) redirect("/admin?error=exists");
    throw error;
  }
  refresh();
  redirect("/admin?saved=release");
}

export async function addEntry(formData: FormData) {
  await requireAdmin();
  const releaseId = formData.get("releaseId");
  const kind = cleanKind(formData.get("kind"));
  const title = cleanText(formData.get("title"), 180);
  const bodyRaw = formData.get("body");
  const body = typeof bodyRaw === "string" ? bodyRaw.trim().slice(0, 4000) : "";
  if (typeof releaseId !== "string" || !isUuid(releaseId) || isFieldError(kind) || isFieldError(title)) {
    redirect("/admin?error=invalid");
  }
  const sql = getSql();
  const found = await sql<{ id: string }[]>`SELECT id FROM releases WHERE id = ${releaseId}::uuid`;
  if (!found[0]) redirect("/admin?error=invalid");
  await insertEntry({ releaseId, kind, title, body });
  refresh();
  redirect("/admin?saved=entry");
}

export async function setReportStatus(formData: FormData) {
  await requireAdmin();
  const id = formData.get("reportId");
  const status = formData.get("status");
  if (typeof id !== "string" || !isUuid(id) || typeof status !== "string" || !(TRIAGE_STATUSES as readonly string[]).includes(status)) {
    redirect("/admin?error=invalid");
  }
  await updateReportStatus(id, status);
  refresh();
  redirect("/admin?saved=status");
}

export async function publishReport(formData: FormData) {
  await requireAdmin();
  const reportId = formData.get("reportId");
  const kind = cleanKind(formData.get("kind"));
  const title = cleanText(formData.get("title"), 180);
  const bodyRaw = formData.get("body");
  const body = typeof bodyRaw === "string" ? bodyRaw.trim().slice(0, 4000) : "";
  if (typeof reportId !== "string" || !isUuid(reportId) || isFieldError(kind) || isFieldError(title)) {
    redirect("/admin?error=invalid");
  }

  const sql = getSql();
  const reports = await sql<{ product_id: string; status: string }[]>`
    SELECT product_id, status FROM reports WHERE id = ${reportId}::uuid
  `;
  const report = reports[0];
  if (!report || report.status === "shipped" || report.status === "spam") {
    redirect("/admin?error=invalid");
  }

  let releaseId = typeof formData.get("releaseId") === "string" ? String(formData.get("releaseId")) : "";
  if (releaseId && !isUuid(releaseId)) redirect("/admin?error=invalid");
  if (!releaseId) {
    const version = cleanVersion(formData.get("version"));
    const releasedOn = cleanDay(formData.get("releasedOn"));
    const summaryRaw = formData.get("summary");
    const summary = typeof summaryRaw === "string" ? summaryRaw.trim().slice(0, 500) : "";
    if (isFieldError(version) || isFieldError(releasedOn)) redirect("/admin?error=invalid");
    try {
      releaseId = await insertRelease({
        productId: report.product_id,
        version,
        releasedOn,
        summary,
      });
    } catch (error) {
      if (isUniqueViolation(error)) redirect("/admin?error=exists");
      throw error;
    }
  }

  try {
    await shipReport({ reportId, releaseId, kind, title, body });
  } catch (error) {
    if (isUniqueViolation(error)) redirect("/admin?error=exists");
    throw error;
  }
  refresh();
  redirect("/admin?saved=shipped");
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
