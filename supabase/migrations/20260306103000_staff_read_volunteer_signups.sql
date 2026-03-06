BEGIN;

DROP POLICY IF EXISTS "Admin can read volunteer signups" ON public.volunteer_signups;
CREATE POLICY "Admin can read volunteer signups"
ON public.volunteer_signups
FOR SELECT
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "Chapter head can read own chapter volunteer signups" ON public.volunteer_signups;
CREATE POLICY "Chapter head can read own chapter volunteer signups"
ON public.volunteer_signups
FOR SELECT
TO authenticated
USING (
  (((SELECT profiles.role
      FROM public.profiles
      WHERE profiles.id = auth.uid()) = 'chapter_head'::text)
   AND EXISTS (
     SELECT 1
     FROM public.volunteer_opportunities
     WHERE volunteer_opportunities.id = volunteer_signups.opportunity_id
       AND volunteer_opportunities.chapter_id = my_chapter_id()
   ))
);

COMMIT;
