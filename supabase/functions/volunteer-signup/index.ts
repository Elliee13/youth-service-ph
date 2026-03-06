/* global Deno, crypto, fetch, URLSearchParams, Response, console */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const BASE_CORS_HEADERS = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const MESSAGE_MAX_LENGTH = 1000;
const MAX_BODY_BYTES = 8192;
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60; // 1 hour
const RATE_LIMIT_MAX_PER_IP = 20;
const RATE_LIMIT_MAX_PER_EMAIL = 5;
const DEFAULT_ALLOWED_ORIGIN = "http://localhost:5173";

const ALLOWED_ORIGINS = new Set(
  [
    ...((Deno.env.get("ALLOWED_ORIGINS") ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)),
    DEFAULT_ALLOWED_ORIGIN,
  ]
);

type SignupPayload = {
  opportunity_id?: unknown;
  full_name?: unknown;
  email?: unknown;
  phone?: unknown;
  message?: unknown;
  turnstile_token?: unknown;
};

type ErrorResponse = {
  ok: false;
  code: string;
  message: string;
};

type SuccessResponse = {
  ok: true;
};

type CorsResult = {
  headers: Record<string, string>;
  forbiddenOrigin: boolean;
};

function getCorsResult(req: Request): CorsResult {
  const origin = req.headers.get("origin");
  const headers: Record<string, string> = { ...BASE_CORS_HEADERS };

  if (!origin) {
    return { headers, forbiddenOrigin: false };
  }

  if (!ALLOWED_ORIGINS.has(origin)) {
    return { headers, forbiddenOrigin: true };
  }

  headers["Access-Control-Allow-Origin"] = origin;
  headers["Vary"] = "Origin";
  return { headers, forbiddenOrigin: false };
}

function json(body: SuccessResponse | ErrorResponse, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function toSha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  return crypto.subtle.digest("SHA-256", bytes).then((digest) =>
    Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
  );
}

function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function getBucketStartIso(now: Date): string {
  const bucketMs =
    Math.floor(now.getTime() / (RATE_LIMIT_WINDOW_SECONDS * 1000)) *
    RATE_LIMIT_WINDOW_SECONDS *
    1000;
  return new Date(bucketMs).toISOString();
}

async function verifyTurnstile(
  secretKey: string,
  token: string,
  remoteIp: string
): Promise<boolean> {
  const body = new URLSearchParams();
  body.set("secret", secretKey);
  body.set("response", token);
  if (remoteIp && remoteIp !== "unknown") body.set("remoteip", remoteIp);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) return false;

  const payload = (await response.json()) as { success?: boolean };
  return payload.success === true;
}

async function getAuthenticatedUserId(
  supabaseUrl: string,
  anonKey: string,
  authorizationHeader: string | null
): Promise<string | null> {
  if (!authorizationHeader) return null;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: authorizationHeader,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user?.id) return null;
  return data.user.id;
}

async function bumpRateLimit(
  admin: ReturnType<typeof createClient>,
  keyType: "ip" | "email_hash",
  keyHash: string,
  bucketStart: string
): Promise<number> {
  const { data, error } = await admin.rpc("bump_volunteer_signup_rate_limit", {
    p_key_type: keyType,
    p_key_hash: keyHash,
    p_bucket_start: bucketStart,
  });

  if (error) {
    console.error("[volunteer-signup] rate limit rpc failed", error);
    throw new Error("rate_limit_failed");
  }

  return typeof data === "number" ? data : Number(data ?? 0);
}

Deno.serve(async (req) => {
  const cors = getCorsResult(req);

  if (cors.forbiddenOrigin) {
    return json({ ok: false, code: "forbidden_origin", message: "Forbidden." }, 403, cors.headers);
  }

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: cors.headers,
    });
  }

  if (req.method !== "POST") {
    return json({ ok: false, code: "method_not_allowed", message: "Method not allowed." }, 405, cors.headers);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("[volunteer-signup] missing required Supabase env configuration");
    return json(
      { ok: false, code: "server_misconfigured", message: "Failed to sign up. Please try again." },
      500,
      cors.headers
    );
  }

  try {
    const rawBody = await req.arrayBuffer();
    if (rawBody.byteLength > MAX_BODY_BYTES) {
      return json(
        { ok: false, code: "payload_too_large", message: "Payload too large." },
        413,
        cors.headers
      );
    }

    let payload: SignupPayload;
    try {
      const rawText = new TextDecoder().decode(rawBody);
      payload = rawText ? (JSON.parse(rawText) as SignupPayload) : {};
    } catch {
      return json(
        { ok: false, code: "invalid_input", message: "Failed to sign up. Please try again." },
        400,
        cors.headers
      );
    }

    const opportunityId = getString(payload.opportunity_id);
    const fullName = getString(payload.full_name);
    const email = normalizeEmail(getString(payload.email));
    const phone = getString(payload.phone);
    const message = getString(payload.message);
    const turnstileToken = getString(payload.turnstile_token);

    if (!opportunityId || !fullName || !email || !phone) {
      return json(
        { ok: false, code: "invalid_input", message: "Failed to sign up. Please try again." },
        400,
        cors.headers
      );
    }

    if (message.length > MESSAGE_MAX_LENGTH) {
      return json(
        { ok: false, code: "invalid_input", message: "Failed to sign up. Please try again." },
        400,
        cors.headers
      );
    }

    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent")?.slice(0, 512) ?? null;
    const now = new Date();
    const bucketStart = getBucketStartIso(now);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const emailHash = await toSha256Hex(email);
    const ipHash = await toSha256Hex(ip);

    const ipAttempts = await bumpRateLimit(admin, "ip", ipHash, bucketStart);
    if (ipAttempts > RATE_LIMIT_MAX_PER_IP) {
      return json(
        { ok: false, code: "rate_limited", message: "Too many requests. Please try again later." },
        429,
        cors.headers
      );
    }

    const emailAttempts = await bumpRateLimit(admin, "email_hash", emailHash, bucketStart);
    if (emailAttempts > RATE_LIMIT_MAX_PER_EMAIL) {
      return json(
        { ok: false, code: "rate_limited", message: "Too many requests. Please try again later." },
        429,
        cors.headers
      );
    }

    const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY");
    const requireTurnstile = Deno.env.get("REQUIRE_TURNSTILE") === "true";
    if (turnstileSecret) {
      if (!turnstileToken) {
        if (requireTurnstile) {
          return json(
            { ok: false, code: "captcha_failed", message: "Failed to sign up. Please try again." },
            400,
            cors.headers
          );
        }
      } else {
        const verified = await verifyTurnstile(turnstileSecret, turnstileToken, ip);
        if (!verified) {
          return json(
            { ok: false, code: "captcha_failed", message: "Failed to sign up. Please try again." },
            400,
            cors.headers
          );
        }
      }
    }

    const userId = await getAuthenticatedUserId(
      supabaseUrl,
      anonKey,
      req.headers.get("authorization")
    );

    const { error } = await admin.from("volunteer_signups").insert({
      opportunity_id: opportunityId,
      full_name: fullName,
      email,
      phone,
      message: message || null,
      user_id: userId,
      created_from_ip: ip,
      user_agent: userAgent,
    });

    if (error) {
      if (error.code === "23505" || error.message.includes("unique_signup")) {
        return json(
          { ok: false, code: "unique_signup", message: "Already applied for this opportunity." },
          409,
          cors.headers
        );
      }

      console.error("[volunteer-signup] insert failed", error);
      return json(
        { ok: false, code: "signup_failed", message: "Failed to sign up. Please try again." },
        400,
        cors.headers
      );
    }

    return json({ ok: true }, 200, cors.headers);
  } catch (error) {
    console.error("[volunteer-signup] unhandled error", error);
    return json(
      { ok: false, code: "internal_error", message: "Failed to sign up. Please try again." },
      500,
      cors.headers
    );
  }
});
