BEGIN;

CREATE TABLE IF NOT EXISTS public.chapters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  location text,
  contact_name text,
  contact_email text,
  contact_phone text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  role text NOT NULL,
  chapter_id uuid,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.programs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  id boolean DEFAULT true PRIMARY KEY,
  projects_count integer DEFAULT 0 NOT NULL,
  chapters_count integer DEFAULT 0 NOT NULL,
  members_count integer DEFAULT 0 NOT NULL,
  contact_email text DEFAULT 'phyouthservice@gmail.com'::text NOT NULL,
  contact_facebook text DEFAULT 'https://www.facebook.com/YOUTHSERVICEPHILIPPINES'::text NOT NULL,
  contact_mobile text DEFAULT '09177798413'::text NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.volunteer_opportunities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name text NOT NULL,
  event_date date NOT NULL,
  chapter_id uuid NOT NULL,
  sdgs text[] DEFAULT '{}'::text[] NOT NULL,
  contact_details text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF to_regclass('public.chapters') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'chapters_pkey'
         AND conrelid = 'public.chapters'::regclass
     ) THEN
    ALTER TABLE ONLY public.chapters
      ADD CONSTRAINT chapters_pkey PRIMARY KEY (id);
  END IF;

  IF to_regclass('public.profiles') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'profiles_pkey'
         AND conrelid = 'public.profiles'::regclass
     ) THEN
    ALTER TABLE ONLY public.profiles
      ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
  END IF;

  IF to_regclass('public.programs') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'programs_pkey'
         AND conrelid = 'public.programs'::regclass
     ) THEN
    ALTER TABLE ONLY public.programs
      ADD CONSTRAINT programs_pkey PRIMARY KEY (id);
  END IF;

  IF to_regclass('public.site_settings') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'site_settings_pkey'
         AND conrelid = 'public.site_settings'::regclass
     ) THEN
    ALTER TABLE ONLY public.site_settings
      ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);
  END IF;

  IF to_regclass('public.volunteer_opportunities') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'volunteer_opportunities_pkey'
         AND conrelid = 'public.volunteer_opportunities'::regclass
     ) THEN
    ALTER TABLE ONLY public.volunteer_opportunities
      ADD CONSTRAINT volunteer_opportunities_pkey PRIMARY KEY (id);
  END IF;

  IF to_regclass('public.profiles') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'profiles_role_check'
         AND conrelid = 'public.profiles'::regclass
     ) THEN
    ALTER TABLE ONLY public.profiles
      ADD CONSTRAINT profiles_role_check CHECK (
        role = ANY (ARRAY['admin'::text, 'chapter_head'::text])
      );
  END IF;

  IF to_regclass('public.profiles') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'profiles_id_fkey'
         AND conrelid = 'public.profiles'::regclass
     ) THEN
    ALTER TABLE ONLY public.profiles
      ADD CONSTRAINT profiles_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF to_regclass('public.profiles') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'profiles_chapter_id_fkey'
         AND conrelid = 'public.profiles'::regclass
     ) THEN
    ALTER TABLE ONLY public.profiles
      ADD CONSTRAINT profiles_chapter_id_fkey
      FOREIGN KEY (chapter_id) REFERENCES public.chapters(id) ON DELETE SET NULL;
  END IF;

  IF to_regclass('public.volunteer_opportunities') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'volunteer_opportunities_chapter_id_fkey'
         AND conrelid = 'public.volunteer_opportunities'::regclass
     ) THEN
    ALTER TABLE ONLY public.volunteer_opportunities
      ADD CONSTRAINT volunteer_opportunities_chapter_id_fkey
      FOREIGN KEY (chapter_id) REFERENCES public.chapters(id) ON DELETE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_chapters_created_at
  ON public.chapters USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_programs_created_at
  ON public.programs USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_opp_chapter_id
  ON public.volunteer_opportunities USING btree (chapter_id);

CREATE INDEX IF NOT EXISTS idx_opp_event_date
  ON public.volunteer_opportunities USING btree (event_date);

DO $$
BEGIN
  IF to_regclass('public.chapters') IS NOT NULL THEN
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.chapters'::regclass) THEN
      ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
    END IF;
  END IF;

  IF to_regclass('public.profiles') IS NOT NULL THEN
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.profiles'::regclass) THEN
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    END IF;
  END IF;

  IF to_regclass('public.programs') IS NOT NULL THEN
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.programs'::regclass) THEN
      ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
    END IF;
  END IF;

  IF to_regclass('public.site_settings') IS NOT NULL THEN
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.site_settings'::regclass) THEN
      ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
    END IF;
  END IF;

  IF to_regclass('public.volunteer_opportunities') IS NOT NULL THEN
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.volunteer_opportunities'::regclass) THEN
      ALTER TABLE public.volunteer_opportunities ENABLE ROW LEVEL SECURITY;
    END IF;
  END IF;
END
$$;

COMMIT;
