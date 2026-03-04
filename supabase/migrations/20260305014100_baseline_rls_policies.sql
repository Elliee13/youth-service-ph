-- Canonical RLS baseline (source of truth)
-- Generated from live pg_policies on 2026-03-05
-- Any drift should be reconciled by updating THIS migration set (new migration), not editing tables manually.


BEGIN;

-- Reset policy surface for baseline tables so final state matches the canonical live set.
DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'chapters',
        'profiles',
        'programs',
        'site_settings',
        'users',
        'volunteer_opportunities',
        'volunteer_signups'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END
$$;

-- chapters
DROP POLICY IF EXISTS "Admin can delete chapters" ON public.chapters;
CREATE POLICY "Admin can delete chapters"
ON public.chapters
FOR DELETE
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "Admin can insert chapters" ON public.chapters;
CREATE POLICY "Admin can insert chapters"
ON public.chapters
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin can update chapters" ON public.chapters;
CREATE POLICY "Admin can update chapters"
ON public.chapters
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Public read chapters" ON public.chapters;
CREATE POLICY "Public read chapters"
ON public.chapters
FOR SELECT
TO anon, authenticated
USING (true);

-- profiles
DROP POLICY IF EXISTS "Admin can manage profiles" ON public.profiles;
CREATE POLICY "Admin can manage profiles"
ON public.profiles
AS PERMISSIVE
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO PUBLIC
USING ((id = auth.uid()));

-- programs
DROP POLICY IF EXISTS "Admin can delete programs" ON public.programs;
CREATE POLICY "Admin can delete programs"
ON public.programs
FOR DELETE
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "Admin can insert programs" ON public.programs;
CREATE POLICY "Admin can insert programs"
ON public.programs
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin can update programs" ON public.programs;
CREATE POLICY "Admin can update programs"
ON public.programs
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Public read programs" ON public.programs;
CREATE POLICY "Public read programs"
ON public.programs
FOR SELECT
TO anon, authenticated
USING (true);

-- site_settings
DROP POLICY IF EXISTS "Admin can update site settings" ON public.site_settings;
CREATE POLICY "Admin can update site settings"
ON public.site_settings
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Public read site settings" ON public.site_settings;
CREATE POLICY "Public read site settings"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (true);

-- users
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own"
ON public.users
FOR SELECT
TO PUBLIC
USING ((auth.uid() = id));

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
TO PUBLIC
USING ((auth.uid() = id))
WITH CHECK ((auth.uid() = id));

-- volunteer_opportunities
DROP POLICY IF EXISTS "Admin can delete volunteer opportunities" ON public.volunteer_opportunities;
CREATE POLICY "Admin can delete volunteer opportunities"
ON public.volunteer_opportunities
FOR DELETE
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "Admin can insert volunteer opportunities" ON public.volunteer_opportunities;
CREATE POLICY "Admin can insert volunteer opportunities"
ON public.volunteer_opportunities
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin can update volunteer opportunities" ON public.volunteer_opportunities;
CREATE POLICY "Admin can update volunteer opportunities"
ON public.volunteer_opportunities
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Chapter head can delete own chapter opportunities" ON public.volunteer_opportunities;
CREATE POLICY "Chapter head can delete own chapter opportunities"
ON public.volunteer_opportunities
FOR DELETE
TO authenticated
USING (((( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'chapter_head'::text) AND (chapter_id = my_chapter_id())));

DROP POLICY IF EXISTS "Chapter head can insert own chapter opportunities" ON public.volunteer_opportunities;
CREATE POLICY "Chapter head can insert own chapter opportunities"
ON public.volunteer_opportunities
FOR INSERT
TO authenticated
WITH CHECK (((( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'chapter_head'::text) AND (chapter_id = my_chapter_id())));

DROP POLICY IF EXISTS "Chapter head can update own chapter opportunities" ON public.volunteer_opportunities;
CREATE POLICY "Chapter head can update own chapter opportunities"
ON public.volunteer_opportunities
FOR UPDATE
TO authenticated
USING (((( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'chapter_head'::text) AND (chapter_id = my_chapter_id())))
WITH CHECK (((( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'chapter_head'::text) AND (chapter_id = my_chapter_id())));

DROP POLICY IF EXISTS "Public read volunteer opportunities" ON public.volunteer_opportunities;
CREATE POLICY "Public read volunteer opportunities"
ON public.volunteer_opportunities
FOR SELECT
TO anon, authenticated
USING (true);

-- volunteer_signups
DROP POLICY IF EXISTS "volunteer_signups_insert_anon" ON public.volunteer_signups;
CREATE POLICY "volunteer_signups_insert_anon"
ON public.volunteer_signups
FOR INSERT
TO anon
WITH CHECK (((user_id IS NULL) AND (opportunity_id IS NOT NULL)));

DROP POLICY IF EXISTS "volunteer_signups_insert_authenticated" ON public.volunteer_signups;
CREATE POLICY "volunteer_signups_insert_authenticated"
ON public.volunteer_signups
FOR INSERT
TO authenticated
WITH CHECK (((user_id = auth.uid()) AND (opportunity_id IS NOT NULL)));

DROP POLICY IF EXISTS "volunteer_signups_select_own" ON public.volunteer_signups;
CREATE POLICY "volunteer_signups_select_own"
ON public.volunteer_signups
FOR SELECT
TO PUBLIC
USING ((auth.uid() = user_id));

COMMIT;
