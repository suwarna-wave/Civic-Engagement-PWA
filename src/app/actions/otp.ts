"use server";

import { randomBytes } from "crypto";
import { z } from "zod";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizeNepalPhone } from "@/lib/otp/phone";
import {
  generateOtpCode,
  getOtpExpirySeconds,
  getOtpMaxVerifyAttempts,
  hashOtpCode,
  verifyOtpHash,
} from "@/lib/otp/crypto";
import { assertOtpSendAllowed } from "@/lib/otp/rate-limit";
import { sendSparrowSms } from "@/lib/otp/sparrow";

export type OtpActionResult =
  | { ok: true; message: string; expiresInSeconds?: number }
  | { ok: false; error: string };

const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "OTP must be a 6-digit code");

function clientIp(): string | null {
  const h = headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return h.get("x-real-ip");
}

function syntheticEmail(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `${digits}@phone.swatantra.local`;
}

export async function sendOtpAction(rawPhone: unknown): Promise<OtpActionResult> {
  const phoneResult = normalizeNepalPhone(rawPhone);
  if (!phoneResult.ok) {
    return { ok: false, error: phoneResult.error };
  }

  const rate = await assertOtpSendAllowed(phoneResult.phone, clientIp());
  if (!rate.ok) {
    return { ok: false, error: rate.error };
  }

  const code = generateOtpCode();
  const expiresInSeconds = getOtpExpirySeconds();
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
  const codeHash = hashOtpCode(phoneResult.phone, code);

  const admin = createAdminClient();
  const { error: insertError } = await admin.from("otp_challenges").insert({
    phone: phoneResult.phone,
    code_hash: codeHash,
    expires_at: expiresAt,
  });

  if (insertError) {
    return { ok: false, error: "Could not create OTP challenge" };
  }

  const sms = await sendSparrowSms({
    to: phoneResult.phone,
    text: `Swatantra Aawaj code: ${code}. Valid for ${expiresInSeconds}s. Do not share.`,
  });

  if (!sms.ok) {
    return { ok: false, error: sms.error };
  }

  return {
    ok: true,
    message: "OTP sent",
    expiresInSeconds,
  };
}

export async function verifyOtpAction(
  rawPhone: unknown,
  rawCode: unknown,
): Promise<OtpActionResult> {
  const phoneResult = normalizeNepalPhone(rawPhone);
  if (!phoneResult.ok) {
    return { ok: false, error: phoneResult.error };
  }

  const codeParsed = otpCodeSchema.safeParse(rawCode);
  if (!codeParsed.success) {
    return {
      ok: false,
      error: codeParsed.error.issues[0]?.message ?? "Invalid OTP",
    };
  }

  const admin = createAdminClient();
  const { data: challenge, error: challengeError } = await admin
    .from("otp_challenges")
    .select("id, code_hash, expires_at, attempt_count, consumed_at")
    .eq("phone", phoneResult.phone)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (challengeError || !challenge) {
    return { ok: false, error: "No active OTP. Request a new code." };
  }

  if (new Date(challenge.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "OTP expired. Request a new code." };
  }

  if (challenge.attempt_count >= getOtpMaxVerifyAttempts()) {
    return {
      ok: false,
      error: "Too many incorrect attempts. Request a new code.",
    };
  }

  const valid = verifyOtpHash(
    phoneResult.phone,
    codeParsed.data,
    challenge.code_hash,
  );

  if (!valid) {
    await admin
      .from("otp_challenges")
      .update({ attempt_count: challenge.attempt_count + 1 })
      .eq("id", challenge.id);
    return { ok: false, error: "Incorrect OTP" };
  }

  await admin
    .from("otp_challenges")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", challenge.id);

  const email = syntheticEmail(phoneResult.phone);
  const oneTimePassword = randomBytes(32).toString("base64url");

  const { data: existingProfile } = await admin
    .from("users")
    .select("id")
    .eq("phone", phoneResult.phone)
    .maybeSingle();

  let userId = existingProfile?.id as string | undefined;

  if (!userId) {
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        phone: phoneResult.phone,
        phone_confirm: true,
        password: oneTimePassword,
        app_metadata: { provider: "sparrow_otp" },
      });

    if (createError || !created.user) {
      return { ok: false, error: "Could not create user" };
    }

    userId = created.user.id;
    await admin.from("users").insert({
      id: userId,
      phone: phoneResult.phone,
      role: "user",
    });
  } else {
    const { error: updateError } = await admin.auth.admin.updateUserById(
      userId,
      {
        email,
        email_confirm: true,
        phone: phoneResult.phone,
        phone_confirm: true,
        password: oneTimePassword,
      },
    );

    if (updateError) {
      return { ok: false, error: "Could not refresh user credentials" };
    }
  }

  const supabase = createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: oneTimePassword,
  });

  if (signInError) {
    return {
      ok: false,
      error: "OTP verified but session establishment failed",
    };
  }

  return { ok: true, message: "Signed in" };
}
