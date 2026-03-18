/* global Deno, Response, console */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

type RequestPayload =
  | {
      action?: "list";
    }
  | {
      action?: "create";
      email?: unknown;
      password?: unknown;
      chapter_id?: unknown;
    }
  | {
      action?: "update";
      profile_id?: unknown;
      chapter_id?: unknown;
    };

type StaffUserRow = {
  id: string;
  email: string | null;
  chapter_id: string | null;
  chapter_name: string | null;
  created_at: string | null;
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getBearerToken(req: Request) {
  const authorization = req.headers.get("authorization")?.trim() ?? "";
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

async function getAdminClient(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("server_misconfigured");
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const accessToken = getBearerToken(req);
  if (!accessToken) {
    throw new Error("unauthorized");
  }

  return { admin, accessToken };
}

async function assertCallerIsAdmin(
  admin: ReturnType<typeof createClient>,
  accessToken: string
) {
  const {
    data: { user },
    error: authError,
  } = await admin.auth.getUser(accessToken);

  if (authError || !user) {
    throw new Error("unauthorized");
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (!profile || profile.role !== "admin") {
    throw new Error("forbidden");
  }
}

async function assertChapterExists(admin: ReturnType<typeof createClient>, chapterId: string) {
  const { data, error } = await admin.from("chapters").select("id").eq("id", chapterId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("invalid_chapter");
}

async function listChapterHeadUsers(admin: ReturnType<typeof createClient>) {
  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, chapter_id, created_at, chapter:chapters(id, name)")
    .eq("role", "chapter_head")
    .order("created_at", { ascending: false });

  if (profilesError) throw profilesError;

  const { data: authUsers, error: authUsersError } = await admin.auth.admin.listUsers();
  if (authUsersError) throw authUsersError;

  const emailById = new Map(authUsers.users.map((user) => [user.id, user.email ?? null]));

  return (profiles ?? []).map((profile) => ({
    id: profile.id,
    email: emailById.get(profile.id) ?? null,
    chapter_id: profile.chapter_id,
    chapter_name:
      profile.chapter && typeof profile.chapter === "object" && "name" in profile.chapter
        ? (profile.chapter.name as string | null)
        : null,
    created_at: profile.created_at ?? null,
  })) as StaffUserRow[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  try {
    const payload = (await req.json()) as RequestPayload;
    const { admin, accessToken } = await getAdminClient(req);
    await assertCallerIsAdmin(admin, accessToken);

    const action = payload.action ?? "list";

    if (action === "list") {
      const users = await listChapterHeadUsers(admin);
      return json({ users });
    }

    if (action === "create") {
      const email = getString(payload.email);
      const password = getString(payload.password);
      const chapterId = getString(payload.chapter_id);

      if (!email || !password || !chapterId) {
        return json({ error: "Email, password, and chapter are required." }, 400);
      }

      if (!isValidEmail(email)) {
        return json({ error: "Please provide a valid email address." }, 400);
      }

      if (password.length < 8) {
        return json({ error: "Temporary password must be at least 8 characters." }, 400);
      }

      await assertChapterExists(admin, chapterId);

      const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createError || !createdUser.user) {
        return json({ error: createError?.message ?? "Failed to create chapter head." }, 400);
      }

      const { error: profileError } = await admin.from("profiles").upsert({
        id: createdUser.user.id,
        role: "chapter_head",
        chapter_id: chapterId,
      });

      if (profileError) {
        return json({ error: profileError.message }, 400);
      }

      return json({ ok: true });
    }

    if (action === "update") {
      const profileId = getString(payload.profile_id);
      const chapterId = getString(payload.chapter_id);

      if (!profileId || !chapterId) {
        return json({ error: "Staff user and chapter are required." }, 400);
      }

      await assertChapterExists(admin, chapterId);

      const { data: existingProfile, error: existingProfileError } = await admin
        .from("profiles")
        .select("id, role")
        .eq("id", profileId)
        .maybeSingle();

      if (existingProfileError) {
        return json({ error: existingProfileError.message }, 400);
      }

      if (!existingProfile || existingProfile.role !== "chapter_head") {
        return json({ error: "Chapter head profile not found." }, 404);
      }

      const { error: updateError } = await admin
        .from("profiles")
        .update({ chapter_id: chapterId })
        .eq("id", profileId);

      if (updateError) {
        return json({ error: updateError.message }, 400);
      }

      return json({ ok: true });
    }

    return json({ error: "Unsupported action." }, 400);
  } catch (error) {
    console.error("[admin-manage-chapter-head] failure", error);

    if (error instanceof Error) {
      if (error.message === "server_misconfigured") {
        return json({ error: "Server is misconfigured." }, 500);
      }

      if (error.message === "unauthorized") {
        return json({ error: "Unauthorized." }, 401);
      }

      if (error.message === "forbidden") {
        return json({ error: "Forbidden." }, 403);
      }

      if (error.message === "invalid_chapter") {
        return json({ error: "Selected chapter does not exist." }, 400);
      }

      return json({ error: error.message }, 400);
    }

    return json({ error: "Unexpected error." }, 500);
  }
});
