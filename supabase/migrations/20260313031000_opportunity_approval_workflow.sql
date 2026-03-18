ALTER TABLE public.volunteer_opportunities
ADD COLUMN IF NOT EXISTS approval_status text;

UPDATE public.volunteer_opportunities
SET approval_status = 'approved'
WHERE approval_status IS NULL;

ALTER TABLE public.volunteer_opportunities
ALTER COLUMN approval_status SET DEFAULT 'approved';

ALTER TABLE public.volunteer_opportunities
ALTER COLUMN approval_status SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'volunteer_opportunities_approval_status_check'
      AND conrelid = 'public.volunteer_opportunities'::regclass
  ) THEN
    ALTER TABLE public.volunteer_opportunities
      ADD CONSTRAINT volunteer_opportunities_approval_status_check
      CHECK (approval_status IN ('pending_approval', 'approved'));
  END IF;
END $$;

DROP POLICY IF EXISTS "Public read volunteer opportunities" ON public.volunteer_opportunities;
CREATE POLICY "Public read volunteer opportunities"
ON public.volunteer_opportunities
FOR SELECT
TO anon, authenticated
USING (approval_status = 'approved');

DROP POLICY IF EXISTS "Admin can read volunteer opportunities" ON public.volunteer_opportunities;
CREATE POLICY "Admin can read volunteer opportunities"
ON public.volunteer_opportunities
FOR SELECT
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "Chapter head can read own chapter volunteer opportunities" ON public.volunteer_opportunities;
CREATE POLICY "Chapter head can read own chapter volunteer opportunities"
ON public.volunteer_opportunities
FOR SELECT
TO authenticated
USING (
  (((SELECT profiles.role
      FROM public.profiles
      WHERE profiles.id = auth.uid()) = 'chapter_head'::text)
   AND (chapter_id = my_chapter_id()))
);
