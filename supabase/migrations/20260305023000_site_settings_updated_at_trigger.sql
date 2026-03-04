BEGIN;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.site_settings') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS site_settings_set_updated_at ON public.site_settings;

    CREATE TRIGGER site_settings_set_updated_at
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.site_settings') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'site_settings_singleton_check'
         AND conrelid = 'public.site_settings'::regclass
     ) THEN
    ALTER TABLE public.site_settings
      ADD CONSTRAINT site_settings_singleton_check CHECK (id IS TRUE);
  END IF;
END
$$;

COMMIT;