type SendSmsResult =
  | { ok: true }
  | { ok: false; error: string; status?: number };

/**
 * Sparrow SMS v2 send. Token never leaves the server.
 * Docs: https://docs.sparrowsms.com
 */
export async function sendSparrowSms(params: {
  to: string;
  text: string;
}): Promise<SendSmsResult> {
  const token = process.env.SPARROW_SMS_TOKEN;
  const from = process.env.SPARROW_SMS_FROM ?? "InfoSMS";
  const apiUrl =
    process.env.SPARROW_SMS_API_URL ?? "https://api.sparrowsms.com/v2/sms/";

  if (!token) {
    return { ok: false, error: "SPARROW_SMS_TOKEN is not configured" };
  }

  // Sparrow expects destination without leading + in many setups; keep digits only after country code handling
  const to = params.to.replace(/^\+/, "");

  const body = new URLSearchParams({
    token,
    from,
    to,
    text: params.text,
  });

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ok: false,
        error: "SMS gateway rejected the request",
        status: response.status,
      };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to reach SMS gateway" };
  }
}
