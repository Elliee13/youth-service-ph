BEGIN;

ALTER TABLE public.volunteer_opportunities
ADD COLUMN IF NOT EXISTS created_by uuid,
ADD COLUMN IF NOT EXISTS created_by_label text;

DO $$
BEGIN
  IF to_regclass('public.volunteer_opportunities') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'volunteer_opportunities_created_by_fkey'
         AND conrelid = 'public.volunteer_opportunities'::regclass
     ) THEN
    ALTER TABLE ONLY public.volunteer_opportunities
      ADD CONSTRAINT volunteer_opportunities_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_opp_created_by
  ON public.volunteer_opportunities USING btree (created_by);

CREATE OR REPLACE FUNCTION public.set_volunteer_opportunity_creator_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := auth.uid();
    NEW.created_by_label := COALESCE(
      NULLIF(BTRIM(auth.jwt() -> 'user_metadata' ->> 'full_name'), ''),
      NULLIF(BTRIM(auth.jwt() ->> 'email'), ''),
      'Unknown staff'
    );
  ELSE
    NEW.created_by := OLD.created_by;
    NEW.created_by_label := OLD.created_by_label;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_volunteer_opportunity_creator_fields ON public.volunteer_opportunities;
CREATE TRIGGER set_volunteer_opportunity_creator_fields
BEFORE INSERT OR UPDATE ON public.volunteer_opportunities
FOR EACH ROW
EXECUTE FUNCTION public.set_volunteer_opportunity_creator_fields();

COMMIT;
