"use client";

import { useState, useTransition } from "react";
import { sendOtpAction, verifyOtpAction } from "@/app/actions/otp";

export function OtpAuthForm() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSend = () => {
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await sendOtpAction(phone);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setStep("code");
      setMessage(
        result.expiresInSeconds
          ? `Code sent. Valid for ${result.expiresInSeconds}s.`
          : result.message,
      );
    });
  };

  const onVerify = () => {
    startTransition(async () => {
      setError(null);
      const result = await verifyOtpAction(phone, code);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage("Signed in");
      window.location.assign("/");
    });
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-emerald-950/10 bg-white/85 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-emerald-950">Sign in with OTP</h2>
      <p className="mt-1 text-sm text-emerald-950/65">
        Nepal mobile number via Sparrow SMS. No password.
      </p>

      <label className="mt-5 block text-sm font-medium text-emerald-950">
        Mobile number
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="98XXXXXXXX"
          className="mt-1 w-full rounded-md border border-emerald-950/15 bg-white px-3 py-2 text-emerald-950 outline-none ring-emerald-700 focus:ring-2"
          disabled={pending}
        />
      </label>

      {step === "code" && (
        <label className="mt-4 block text-sm font-medium text-emerald-950">
          6-digit code
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="mt-1 w-full rounded-md border border-emerald-950/15 bg-white px-3 py-2 tracking-[0.3em] text-emerald-950 outline-none ring-emerald-700 focus:ring-2"
            disabled={pending}
          />
        </label>
      )}

      <div className="mt-5 flex gap-2">
        {step === "phone" ? (
          <button
            type="button"
            onClick={onSend}
            disabled={pending || phone.trim().length < 8}
            className="rounded-md bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-50"
          >
            {pending ? "Sending…" : "Send OTP"}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onVerify}
              disabled={pending || code.length !== 6}
              className="rounded-md bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-50"
            >
              {pending ? "Verifying…" : "Verify"}
            </button>
            <button
              type="button"
              onClick={onSend}
              disabled={pending}
              className="rounded-md bg-transparent px-4 py-2 text-sm font-medium text-emerald-900 underline-offset-2 hover:underline disabled:opacity-50"
            >
              Resend
            </button>
          </>
        )}
      </div>

      {message && (
        <p className="mt-3 text-sm text-emerald-800" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
