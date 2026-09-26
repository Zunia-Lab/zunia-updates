"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clientIp, hashIp } from "@/lib/admin";
import { insertReport, recentReportCount } from "@/lib/queries";
import { verifyTurnstile } from "@/lib/turnstile";
import { cleanBody, cleanContact, cleanProduct, cleanReportType, cleanText, isFieldError } from "@/lib/validate";

export async function submitReport(formData: FormData) {
  const type = cleanReportType(formData.get("type"));
  const productId = cleanProduct(formData.get("productId"));
  const title = cleanText(formData.get("title"), 140);
  const body = cleanBody(formData.get("body"));
  const contact = cleanContact(formData.get("contact"));
  if (
    isFieldError(type) ||
    isFieldError(productId) ||
    isFieldError(title) ||
    isFieldError(body) ||
    isFieldError(contact)
  ) {
    redirect("/requests/new?error=invalid");
  }

  const headerStore = await headers();
  const ip = clientIp(headerStore);
  const ipHash = hashIp(ip);
  if ((await recentReportCount(ipHash)) >= 5) {
    redirect("/requests/new?error=rate");
  }

  const token = formData.get("cf-turnstile-response");
  const human = await verifyTurnstile(typeof token === "string" ? token : "", ip);
  if (!human) redirect("/requests/new?error=human");

  await insertReport({ type, productId, title, body, contact, ipHash });
  redirect("/requests/new?sent=1");
}
