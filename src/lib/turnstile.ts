const TEST_SITE_KEY = "1x00000000000000000000AA";
const TEST_SECRET = "1x0000000000000000000000000000000AA";

export function turnstileSiteKey(): string {
  const configured = process.env.TURNSTILE_SITE_KEY || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (configured) return configured;
  return process.env.NODE_ENV === "production" ? "" : TEST_SITE_KEY;
}

function turnstileSecret(): string | null {
  const configured = process.env.TURNSTILE_SECRET_KEY;
  if (configured) return configured;
  return process.env.NODE_ENV === "production" ? null : TEST_SECRET;
}

export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = turnstileSecret();
  if (!secret || !token) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip && ip !== "local" && ip !== "unknown") body.set("remoteip", ip);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  if (!response.ok) return false;
  const data = (await response.json()) as { success?: boolean };
  return data.success === true;
}
