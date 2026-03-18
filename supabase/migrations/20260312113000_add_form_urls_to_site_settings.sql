ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS membership_form_url text,
ADD COLUMN IF NOT EXISTS chapter_proposal_form_url text;

UPDATE public.site_settings
SET
  membership_form_url = COALESCE(
    membership_form_url,
    'https://docs.google.com/forms/d/e/1FAIpQLSdwMKgIjQNrlLH-j-Qdx0MrKxefxaLRC6gMI_oOgMTosDi_sQ/viewform'
  ),
  chapter_proposal_form_url = COALESCE(
    chapter_proposal_form_url,
    'https://docs.google.com/forms/d/e/1FAIpQLSefJ0IY39AUBd89A9VC0bojAQSPMXIqas9idU2gRxlSdg3Zkw/viewform'
  )
WHERE id = true;
