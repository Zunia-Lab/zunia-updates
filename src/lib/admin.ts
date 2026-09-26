import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createRemoteJWKSet, jwtVerify } from "jose";

export const ADMIN_COOKIE = "zunia_updates_admin";

export function adminSeal(secret: string): string {
  return createHmac("sha256", secret).update("zunia-updates-admin-v1").digest("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

export function hashIp(ip: string): string {
  const key = process.env.ADMIN_TOKEN || "zunia-updates-dev";
  return createHmac("sha256", key).update(ip).digest("hex");
}

export function clientIp(headerStore: Headers): string {
  if (process.env.TRUST_PROXY === "cloudflare") {
    return headerStore.get("cf-connecting-ip") || "unknown";
  }
  return "local";
}

type AccessState = "off" | "ok" | "missing";

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

async function accessState(): Promise<AccessState> {
  const team = process.env.CF_ACCESS_TEAM_DOMAIN;
  const audience = process.env.CF_ACCESS_AUD;
  if (!team || !audience) return "off";
  const headerStore = await headers();
  const token =
    headerStore.get("cf-access-jwt-assertion") ||
    readCookie(headerStore.get("cookie"), "CF_Authorization");
  if (!token) return "missing";
  try {
    if (!jwks) {
      jwks = createRemoteJWKSet(new URL(`https://${team}.cloudflareaccess.com/cdn-cgi/access/certs`));
    }
    await jwtVerify(token, jwks, {
      audience,
      issuer: `https://${team}.cloudflareaccess.com`,
    });
    return "ok";
  } catch {
    return "missing";
  }
}

function readCookie(header: string | null, name: string): string {
  if (!header) return "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

export async function adminSession(): Promise<"ok" | "unconfigured" | "anonymous" | "access"> {
  const access = await accessState();
  if (access === "missing") return "access";
  const secret = process.env.ADMIN_TOKEN;
  if (!secret) return "unconfigured";
  const jar = await cookies();
  const given = jar.get(ADMIN_COOKIE)?.value ?? "";
  if (!safeEqual(given, adminSeal(secret))) return "anonymous";
  return "ok";
}

export async function requireAdmin(): Promise<void> {
  const session = await adminSession();
  if (session !== "ok") redirect("/admin/login");
}
