BEGIN;

DROP POLICY IF EXISTS "Anyone can sign up for opportunities" ON public.volunteer_signups;
DROP POLICY IF EXISTS "Authenticated users can view sign-ups" ON public.volunteer_signups;

COMMIT;
