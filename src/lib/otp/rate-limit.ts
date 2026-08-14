import { createAdminClient } from "@/lib/supabase/admin";
import {
  getOtpMaxSends,
  getOtpRateWindowSeconds,
  hashIp,
} from "@/lib/otp/crypto";

export type RateLimitResult =
  | { ok: true }
  | { ok: false; error: string; retryAfterSeconds?: number };

export async function assertOtpSendAllowed(
  phone: string,
  ip: string | null,
): Promise<RateLimitResult> {
  const admin = createAdminClient();
  const windowSeconds = getOtpRateWindowSeconds();
  const maxSends = getOtpMaxSends();
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();

  const { count, error } = await admin
    .from("otp_rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("phone", phone)
    .gte("created_at", since);

  if (error) {
    return { ok: false, error: "Unable to enforce rate limit" };
  }

  if ((count ?? 0) >= maxSends) {
    return {
      ok: false,
      error: "Too many OTP requests. Please try again later.",
      retryAfterSeconds: windowSeconds,
    };
  }

  const { error: insertError } = await admin.from("otp_rate_limits").insert({
    phone,
    ip_hash: hashIp(ip),
  });

  if (insertError) {
    return { ok: false, error: "Unable to record rate limit event" };
  }

  return { ok: true };
}
