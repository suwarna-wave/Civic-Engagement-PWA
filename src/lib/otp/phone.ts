import { z } from "zod";

/** Nepal mobile: +977 then 97/98 and 8 digits, or local 97/98xxxxxxxx */
const nepalPhoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s\-()]/g, ""))
  .refine((value) => /^(?:\+?977)?9[78]\d{8}$/.test(value), {
    message: "Enter a valid Nepal mobile number",
  })
  .transform((value) => {
    const digits = value.replace(/^\+?977/, "");
    return `+977${digits}`;
  });

export type PhoneParseResult =
  | { ok: true; phone: string }
  | { ok: false; error: string };

export function normalizeNepalPhone(input: unknown): PhoneParseResult {
  const parsed = nepalPhoneSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid phone number",
    };
  }
  return { ok: true, phone: parsed.data };
}
