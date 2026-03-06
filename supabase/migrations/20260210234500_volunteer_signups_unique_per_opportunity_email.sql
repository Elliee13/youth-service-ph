CREATE UNIQUE INDEX IF NOT EXISTS unique_signup
ON public.volunteer_signups (opportunity_id, lower(email));

-- If this migration fails due to existing duplicates, inspect with:
-- SELECT
--   opportunity_id,
--   lower(email) AS normalized_email,
--   COUNT(*) AS duplicate_count
-- FROM public.volunteer_signups
-- GROUP BY opportunity_id, lower(email)
-- HAVING COUNT(*) > 1;
