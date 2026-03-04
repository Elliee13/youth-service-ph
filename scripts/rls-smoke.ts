/* global process, console */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type ProfileRow = {
  id: string;
  role: string;
  chapter_id: string | null;
};

type OpportunityInsert = {
  event_name: string;
  event_date: string;
  chapter_id: string;
  sdgs: string[];
  contact_details: string;
};

type ErrorLike = {
  code?: string;
  message?: string;
};

const runId = `${Date.now()}`;
const marker = `[rls-smoke:${runId}]`;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function getEnv(name: string, optional = false): string {
  const value = process.env[name];
  if (!value && !optional) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value ?? "";
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as ErrorLike).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

function isErrorLike(error: unknown): error is ErrorLike {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { code?: unknown; message?: unknown };
  const codeOk = maybe.code == null || typeof maybe.code === "string";
  const messageOk = maybe.message == null || typeof maybe.message === "string";
  return codeOk && messageOk;
}

function makeClient(url: string, key: string): SupabaseClient {
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

async function signIn(client: SupabaseClient, email: string, password: string, label: string) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  assert(!error, `[${label}] signIn failed: ${getErrorMessage(error, "unknown error")}`);
  assert(data.user?.id, `[${label}] signIn did not return user id`);
  return data.user.id;
}

async function ensureChapter(serviceClient: SupabaseClient, name: string) {
  const existing = await serviceClient
    .from("chapters")
    .select("id")
    .eq("name", name)
    .order("created_at", { ascending: false })
    .limit(1);

  assert(!existing.error, `[setup] chapter lookup failed: ${getErrorMessage(existing.error, "unknown")}`);

  const existingId = existing.data?.[0]?.id;
  if (existingId) return { id: existingId, created: false };

  const created = await serviceClient
    .from("chapters")
    .insert({
      name,
      description: `${marker} chapter`,
      location: "RLS Smoke",
      contact_name: "RLS Smoke",
      contact_email: `rls-smoke+${runId}@example.com`,
      contact_phone: "09000000000",
    })
    .select("id")
    .single();

  assert(!created.error, `[setup] chapter create failed: ${getErrorMessage(created.error, "unknown")}`);
  assert(created.data?.id, "[setup] chapter create returned no id");
  return { id: created.data.id, created: true };
}

async function upsertProfile(
  serviceClient: SupabaseClient,
  input: { id: string; role: "admin" | "chapter_head"; chapter_id: string | null }
) {
  const res = await serviceClient.from("profiles").upsert(input, { onConflict: "id" });
  assert(!res.error, `[setup] profile upsert failed: ${getErrorMessage(res.error, "unknown")}`);
}

async function ensureOpportunity(
  serviceClient: SupabaseClient,
  payload: OpportunityInsert
) {
  const created = await serviceClient
    .from("volunteer_opportunities")
    .insert(payload)
    .select("id")
    .single();

  assert(
    !created.error,
    `[setup] opportunity create failed: ${getErrorMessage(created.error, "unknown")}`
  );
  assert(created.data?.id, "[setup] opportunity create returned no id");
  return created.data.id;
}

async function upsertPublicUser(
  serviceClient: SupabaseClient,
  userId: string,
  email: string,
  fullName: string
) {
  const res = await serviceClient.from("users").upsert(
    {
      id: userId,
      email,
      full_name: fullName,
      phone: null,
    },
    { onConflict: "id" }
  );
  assert(!res.error, `[setup] users upsert failed: ${getErrorMessage(res.error, "unknown")}`);
}

async function main() {
  const url = getEnv("VITE_SUPABASE_URL");
  const anonKey = getEnv("VITE_SUPABASE_ANON_KEY");
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  const adminEmail = getEnv("TEST_ADMIN_EMAIL");
  const adminPassword = getEnv("TEST_ADMIN_PASSWORD");
  const chapterEmail = getEnv("TEST_CHAPTER_EMAIL");
  const chapterPassword = getEnv("TEST_CHAPTER_PASSWORD");
  const volunteerEmailEnv = getEnv("TEST_VOLUNTEER_EMAIL", true);
  const volunteerPasswordEnv = getEnv("TEST_VOLUNTEER_PASSWORD", true);

  if ((volunteerEmailEnv && !volunteerPasswordEnv) || (!volunteerEmailEnv && volunteerPasswordEnv)) {
    throw new Error("Provide both TEST_VOLUNTEER_EMAIL and TEST_VOLUNTEER_PASSWORD, or neither.");
  }

  const anonClient = makeClient(url, anonKey);
  const adminClient = makeClient(url, anonKey);
  const chapterClient = makeClient(url, anonKey);
  const volunteerClient = makeClient(url, anonKey);
  const serviceClient = makeClient(url, serviceKey);

  const cleanup = {
    signupIds: [] as string[],
    opportunityIds: [] as string[],
    programIds: [] as string[],
    chapterIds: [] as string[],
  };

  let createdVolunteerAuthUserId: string | null = null;
  let volunteerEmail = volunteerEmailEnv;
  let volunteerPassword = volunteerPasswordEnv;

  let adminId = "";
  let chapterHeadId = "";
  let volunteerId = "";
  let ownChapterId = "";
  let otherChapterId = "";

  const previousProfiles = new Map<string, ProfileRow>();
  const insertedProfileIds = new Set<string>();

  try {
    console.log(`[rls-smoke] starting run ${runId}`);

    adminId = await signIn(adminClient, adminEmail, adminPassword, "admin");
    chapterHeadId = await signIn(chapterClient, chapterEmail, chapterPassword, "chapter_head");

    if (volunteerEmail && volunteerPassword) {
      volunteerId = await signIn(volunteerClient, volunteerEmail, volunteerPassword, "volunteer");
    } else {
      volunteerEmail = `rls-smoke+${runId}@example.com`;
      volunteerPassword = `RlsSmoke!${runId}Aa`;
      const created = await serviceClient.auth.admin.createUser({
        email: volunteerEmail,
        password: volunteerPassword,
        email_confirm: true,
        user_metadata: { full_name: "RLS Smoke Volunteer" },
      });
      assert(
        !created.error,
        `[setup] volunteer user create failed: ${getErrorMessage(created.error, "unknown")}`
      );
      assert(created.data.user?.id, "[setup] volunteer user create returned no id");
      createdVolunteerAuthUserId = created.data.user.id;
      volunteerId = await signIn(volunteerClient, volunteerEmail, volunteerPassword, "volunteer(temp)");
    }

    assert(volunteerEmail, "Volunteer email should be available after setup.");
    await upsertPublicUser(serviceClient, volunteerId, volunteerEmail, `${marker} volunteer`);

    const snapshot = await serviceClient
      .from("profiles")
      .select("id, role, chapter_id")
      .in("id", [adminId, chapterHeadId]);

    assert(!snapshot.error, `[setup] profile snapshot failed: ${getErrorMessage(snapshot.error, "unknown")}`);
    for (const row of snapshot.data ?? []) previousProfiles.set(row.id, row);

    const ownChapter = await ensureChapter(serviceClient, `${marker} own chapter`);
    ownChapterId = ownChapter.id;
    if (ownChapter.created) cleanup.chapterIds.push(ownChapterId);

    const otherChapter = await ensureChapter(serviceClient, `${marker} other chapter`);
    otherChapterId = otherChapter.id;
    if (otherChapter.created) cleanup.chapterIds.push(otherChapterId);

    await upsertProfile(serviceClient, {
      id: adminId,
      role: "admin",
      chapter_id: null,
    });
    if (!previousProfiles.has(adminId)) insertedProfileIds.add(adminId);

    await upsertProfile(serviceClient, {
      id: chapterHeadId,
      role: "chapter_head",
      chapter_id: ownChapterId,
    });
    if (!previousProfiles.has(chapterHeadId)) insertedProfileIds.add(chapterHeadId);

    const baseOpportunityId = await ensureOpportunity(serviceClient, {
      event_name: `${marker} base opportunity`,
      event_date: todayIsoDate(),
      chapter_id: ownChapterId,
      sdgs: ["SDG 4"],
      contact_details: `${marker} contact`,
    });
    cleanup.opportunityIds.push(baseOpportunityId);

    // ANON: public reads should work
    {
      const checks = [
        anonClient.from("chapters").select("id").limit(1),
        anonClient.from("programs").select("id").limit(1),
        anonClient.from("volunteer_opportunities").select("id").limit(1),
        anonClient.from("site_settings").select("id").eq("id", true).limit(1),
      ];
      const [chaptersRead, programsRead, opportunitiesRead, settingsRead] = await Promise.all(checks);
      assert(!chaptersRead.error, `[anon] chapters SELECT failed: ${getErrorMessage(chaptersRead.error, "unknown")}`);
      assert(!programsRead.error, `[anon] programs SELECT failed: ${getErrorMessage(programsRead.error, "unknown")}`);
      assert(
        !opportunitiesRead.error,
        `[anon] volunteer_opportunities SELECT failed: ${getErrorMessage(opportunitiesRead.error, "unknown")}`
      );
      assert(
        !settingsRead.error,
        `[anon] site_settings SELECT failed: ${getErrorMessage(settingsRead.error, "unknown")}`
      );
    }

    // ANON: writes should fail
    {
      const chapterInsert = await anonClient
        .from("chapters")
        .insert({ name: `${marker} anon chapter` })
        .select("id")
        .maybeSingle();
      assert(chapterInsert.error, "[anon] chapters INSERT unexpectedly succeeded.");
      if (chapterInsert.data?.id) cleanup.chapterIds.push(chapterInsert.data.id);

      const programInsert = await anonClient
        .from("programs")
        .insert({
          title: `${marker} anon program`,
          description: `${marker} desc`,
          image_url: null,
        })
        .select("id")
        .maybeSingle();
      assert(programInsert.error, "[anon] programs INSERT unexpectedly succeeded.");
      if (programInsert.data?.id) cleanup.programIds.push(programInsert.data.id);

      const oppInsert = await anonClient
        .from("volunteer_opportunities")
        .insert({
          event_name: `${marker} anon opportunity`,
          event_date: todayIsoDate(),
          chapter_id: ownChapterId,
          sdgs: ["SDG 1"],
          contact_details: `${marker} contact`,
        })
        .select("id")
        .maybeSingle();
      assert(oppInsert.error, "[anon] volunteer_opportunities INSERT unexpectedly succeeded.");
      if (oppInsert.data?.id) cleanup.opportunityIds.push(oppInsert.data.id);
    }

    // ADMIN: CRUD should work
    {
      const created = await adminClient
        .from("programs")
        .insert({
          title: `${marker} admin program`,
          description: `${marker} program desc`,
          image_url: null,
        })
        .select("id")
        .single();

      assert(!created.error, `[admin] program INSERT failed: ${getErrorMessage(created.error, "unknown")}`);
      assert(created.data?.id, "[admin] program INSERT returned no id");
      const programId = created.data.id;

      const updated = await adminClient
        .from("programs")
        .update({ title: `${marker} admin program updated` })
        .eq("id", programId);
      assert(!updated.error, `[admin] program UPDATE failed: ${getErrorMessage(updated.error, "unknown")}`);

      const deleted = await adminClient.from("programs").delete().eq("id", programId);
      assert(!deleted.error, `[admin] program DELETE failed: ${getErrorMessage(deleted.error, "unknown")}`);
    }

    // CHAPTER_HEAD: own chapter insert works
    {
      const ownInsert = await chapterClient
        .from("volunteer_opportunities")
        .insert({
          event_name: `${marker} chapter own`,
          event_date: todayIsoDate(),
          chapter_id: ownChapterId,
          sdgs: ["SDG 10"],
          contact_details: `${marker} chapter contact`,
        })
        .select("id, chapter_id")
        .single();

      assert(
        !ownInsert.error,
        `[chapter_head] own chapter INSERT failed: ${getErrorMessage(ownInsert.error, "unknown")}`
      );
      assert(ownInsert.data?.id, "[chapter_head] own chapter INSERT returned no id");
      assert(
        ownInsert.data.chapter_id === ownChapterId,
        "[chapter_head] own chapter INSERT returned unexpected chapter_id."
      );
      cleanup.opportunityIds.push(ownInsert.data.id);

      const wrongInsert = await chapterClient
        .from("volunteer_opportunities")
        .insert({
          event_name: `${marker} chapter wrong`,
          event_date: todayIsoDate(),
          chapter_id: otherChapterId,
          sdgs: ["SDG 11"],
          contact_details: `${marker} wrong chapter`,
        })
        .select("id")
        .maybeSingle();

      assert(wrongInsert.error, "[chapter_head] cross-chapter INSERT unexpectedly succeeded.");
      if (wrongInsert.data?.id) cleanup.opportunityIds.push(wrongInsert.data.id);
    }

    // VOLUNTEER: own signup insert/select only own
    {
      const volunteerOpportunityId = await ensureOpportunity(serviceClient, {
        event_name: `${marker} volunteer opportunity`,
        event_date: todayIsoDate(),
        chapter_id: ownChapterId,
        sdgs: ["SDG 3"],
        contact_details: `${marker} volunteer contact`,
      });
      cleanup.opportunityIds.push(volunteerOpportunityId);

      const ownSignup = await volunteerClient
        .from("volunteer_signups")
        .insert({
          opportunity_id: volunteerOpportunityId,
          user_id: volunteerId,
          full_name: `${marker} volunteer self`,
          email: volunteerEmail,
          phone: "09170000000",
          message: `${marker} own signup`,
        })
        .select("id, user_id")
        .single();

      assert(
        !ownSignup.error,
        `[volunteer] own signup INSERT failed: ${getErrorMessage(ownSignup.error, "unknown")}`
      );
      assert(ownSignup.data?.id, "[volunteer] own signup INSERT returned no id");
      assert(ownSignup.data.user_id === volunteerId, "[volunteer] own signup has wrong user_id.");
      cleanup.signupIds.push(ownSignup.data.id);

      const foreignSignup = await serviceClient
        .from("volunteer_signups")
        .insert({
          opportunity_id: volunteerOpportunityId,
          user_id: null,
          full_name: `${marker} foreign`,
          email: `rls-smoke-foreign+${runId}@example.com`,
          phone: "09179999999",
          message: `${marker} foreign signup`,
        })
        .select("id")
        .single();

      assert(
        !foreignSignup.error,
        `[setup] foreign signup INSERT failed: ${getErrorMessage(foreignSignup.error, "unknown")}`
      );
      assert(foreignSignup.data?.id, "[setup] foreign signup INSERT returned no id");
      cleanup.signupIds.push(foreignSignup.data.id);

      const visible = await volunteerClient
        .from("volunteer_signups")
        .select("id, user_id")
        .order("created_at", { ascending: false });

      assert(!visible.error, `[volunteer] signup SELECT failed: ${getErrorMessage(visible.error, "unknown")}`);

      const rows = visible.data ?? [];
      assert(rows.some((r) => r.id === ownSignup.data.id), "[volunteer] own signup not visible.");
      assert(
        rows.every((r) => r.user_id === volunteerId),
        "[volunteer] non-owned signup became visible."
      );
      assert(
        !rows.some((r) => r.id === foreignSignup.data.id),
        "[volunteer] foreign signup should not be visible."
      );
    }

    console.log("[rls-smoke] PASS");
  } finally {
    // Restore profiles to previous state before deleting any created chapters.
    for (const userId of [adminId, chapterHeadId]) {
      if (!userId) continue;
      const previous = previousProfiles.get(userId);
      if (previous) {
        const restore = await serviceClient.from("profiles").upsert(
          {
            id: previous.id,
            role: previous.role,
            chapter_id: previous.chapter_id,
          },
          { onConflict: "id" }
        );
        if (restore.error) {
          console.error(`[cleanup] profile restore failed for ${userId}: ${getErrorMessage(restore.error, "unknown")}`);
        }
      } else if (insertedProfileIds.has(userId)) {
        const remove = await serviceClient.from("profiles").delete().eq("id", userId);
        if (remove.error) {
          console.error(`[cleanup] profile delete failed for ${userId}: ${getErrorMessage(remove.error, "unknown")}`);
        }
      }
    }

    if (cleanup.signupIds.length > 0) {
      const res = await serviceClient.from("volunteer_signups").delete().in("id", cleanup.signupIds);
      if (res.error) {
        console.error(`[cleanup] volunteer_signups delete failed: ${getErrorMessage(res.error, "unknown")}`);
      }
    }

    if (cleanup.opportunityIds.length > 0) {
      const res = await serviceClient
        .from("volunteer_opportunities")
        .delete()
        .in("id", cleanup.opportunityIds);
      if (res.error) {
        console.error(`[cleanup] volunteer_opportunities delete failed: ${getErrorMessage(res.error, "unknown")}`);
      }
    }

    if (cleanup.programIds.length > 0) {
      const res = await serviceClient.from("programs").delete().in("id", cleanup.programIds);
      if (res.error) {
        console.error(`[cleanup] programs delete failed: ${getErrorMessage(res.error, "unknown")}`);
      }
    }

    if (cleanup.chapterIds.length > 0) {
      const res = await serviceClient.from("chapters").delete().in("id", cleanup.chapterIds);
      if (res.error) {
        console.error(`[cleanup] chapters delete failed: ${getErrorMessage(res.error, "unknown")}`);
      }
    }

    if (createdVolunteerAuthUserId) {
      const deleted = await serviceClient.auth.admin.deleteUser(createdVolunteerAuthUserId);
      if (deleted.error) {
        console.error(`[cleanup] temp volunteer auth user delete failed: ${getErrorMessage(deleted.error, "unknown")}`);
      }
    }
  }
}

main().catch((error: unknown) => {
  const code = isErrorLike(error) && error.code ? ` (${error.code})` : "";
  console.error(`[rls-smoke] FAIL${code}: ${getErrorMessage(error, "unknown failure")}`);
  process.exit(1);
});
