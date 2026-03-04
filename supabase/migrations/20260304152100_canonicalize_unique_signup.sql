BEGIN;

ALTER TABLE public.volunteer_signups
  DROP CONSTRAINT IF EXISTS unique_signup;

DROP INDEX IF EXISTS public.unique_signup;

CREATE UNIQUE INDEX unique_signup
ON public.volunteer_signups(opportunity_id, lower(email));

COMMIT;
