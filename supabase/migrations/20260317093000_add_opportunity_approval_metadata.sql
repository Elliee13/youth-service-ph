BEGIN;

ALTER TABLE public.volunteer_opportunities
ADD COLUMN IF NOT EXISTS approved_by uuid,
ADD COLUMN IF NOT EXISTS approved_at timestamptz;

DO $$
BEGIN
  IF to_regclass('public.volunteer_opportunities') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'volunteer_opportunities_approved_by_fkey'
         AND conrelid = 'public.volunteer_opportunities'::regclass
     ) THEN
    ALTER TABLE ONLY public.volunteer_opportunities
      ADD CONSTRAINT volunteer_opportunities_approved_by_fkey
      FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_opp_approved_by
  ON public.volunteer_opportunities USING btree (approved_by);

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

  IF NEW.approval_status = 'approved' THEN
    IF TG_OP = 'INSERT' OR COALESCE(OLD.approval_status, '') <> 'approved' THEN
      NEW.approved_by := auth.uid();
      NEW.approved_at := now();
    ELSE
      NEW.approved_by := OLD.approved_by;
      NEW.approved_at := OLD.approved_at;
    END IF;
  ELSE
    NEW.approved_by := NULL;
    NEW.approved_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

COMMIT;
