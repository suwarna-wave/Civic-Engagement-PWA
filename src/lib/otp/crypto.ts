import { createHash, createHmac, randomInt, timingSafeEqual } from "crypto";

function getHmacSecret() {
  const secret = process.env.OTP_HMAC_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("OTP_HMAC_SECRET must be set to at least 32 characters");
  }
  return secret;
}

export function generateOtpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtpCode(phone: string, code: string): string {
  return createHmac("sha256", getHmacSecret())
    .update(`${phone}:${code}`)
    .digest("hex");
}

export function verifyOtpHash(
  phone: string,
  code: string,
  expectedHash: string,
): boolean {
  const actual = hashOtpCode(phone, code);
  const a = Buffer.from(actual, "utf8");
  const b = Buffer.from(expectedHash, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex");
}

export function getOtpExpirySeconds(): number {
  const raw = Number(process.env.OTP_EXPIRY_SECONDS ?? 180);
  if (!Number.isFinite(raw)) return 180;
  return Math.min(300, Math.max(60, Math.floor(raw)));
}

export function getOtpMaxSends(): number {
  return Math.max(1, Number(process.env.OTP_MAX_SENDS_PER_WINDOW ?? 3));
}

export function getOtpRateWindowSeconds(): number {
  return Math.max(60, Number(process.env.OTP_RATE_WINDOW_SECONDS ?? 600));
}

export function getOtpMaxVerifyAttempts(): number {
  return Math.max(1, Number(process.env.OTP_MAX_VERIFY_ATTEMPTS ?? 5));
}
