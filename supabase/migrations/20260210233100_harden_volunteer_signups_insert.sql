BEGIN;

DROP POLICY IF EXISTS "Allow public inserts for vol signups" ON public.volunteer_signups;
DROP POLICY IF EXISTS "volunteer_signups_insert_public" ON public.volunteer_signups;
DROP POLICY IF EXISTS "volunteer_signups_insert_anon" ON public.volunteer_signups;
DROP POLICY IF EXISTS "volunteer_signups_insert_authenticated" ON public.volunteer_signups;

CREATE POLICY "volunteer_signups_insert_anon"
ON public.volunteer_signups
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL
  AND opportunity_id IS NOT NULL
);

CREATE POLICY "volunteer_signups_insert_authenticated"
ON public.volunteer_signups
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND opportunity_id IS NOT NULL
);

COMMIT;
