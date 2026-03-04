BEGIN;

-- chapters: drop redundant policy, keep "Public read chapters"
DROP POLICY IF EXISTS "Chapters are publicly readable" ON public.chapters;

-- programs: drop redundant policy, keep "Public read programs"
DROP POLICY IF EXISTS "Programs are publicly readable" ON public.programs;

-- site_settings: drop redundant policy, keep "Public read site settings"
DROP POLICY IF EXISTS "Site settings are publicly readable" ON public.site_settings;

-- volunteer_opportunities: drop redundant policy, keep "Opportunities are publicly readable"
DROP POLICY IF EXISTS "Public read volunteer opportunities" ON public.volunteer_opportunities;

COMMIT;
