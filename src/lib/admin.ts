import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { isTeam, type Team } from "./types";

export const ADMIN_COOKIE = "zunia_updates_admin";

export function adminSeal(secret: string, team: Team): string {
  const mac = createHmac("sha256", secret).update(`zunia-updates-admin-v2:${team}`).digest("base64url");
  return `${team}.${mac}`;
}

export function teamFromCookie(secret: string, given: string): Team | null {
  const dot = given.indexOf(".");
  if (dot < 1) return null;
  const team = given.slice(0, dot);
  if (!isTeam(team)) return null;
  if (!safeEqual(given, adminSeal(secret, team))) return null;
  return team;
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

export type AdminGate =
  | { state: "ok"; team: Team }
  | { state: "unconfigured" }
  | { state: "anonymous" }
  | { state: "access" };

export async function adminSession(): Promise<AdminGate> {
  const access = await accessState();
  if (access === "missing") return { state: "access" };
  const secret = process.env.ADMIN_TOKEN;
  if (!secret) return { state: "unconfigured" };
  const jar = await cookies();
  const given = jar.get(ADMIN_COOKIE)?.value ?? "";
  const team = teamFromCookie(secret, given);
  if (!team) return { state: "anonymous" };
  return { state: "ok", team };
}

export async function requireAdmin(): Promise<Team> {
  const session = await adminSession();
  if (session.state !== "ok") redirect("/admin/login");
  return session.team;
}
