BEGIN;

-- Additive hardening for volunteer signups payload constraints and metadata.
ALTER TABLE public.volunteer_signups
  ADD COLUMN IF NOT EXISTS created_from_ip text,
  ADD COLUMN IF NOT EXISTS user_agent text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'volunteer_signups_message_length_check'
      AND conrelid = 'public.volunteer_signups'::regclass
  ) THEN
    ALTER TABLE public.volunteer_signups
      ADD CONSTRAINT volunteer_signups_message_length_check
      CHECK (message IS NULL OR char_length(message) <= 1000);
  END IF;
END $$;

-- Rate limit bucket table used by the volunteer-signup edge function.
CREATE TABLE IF NOT EXISTS public.volunteer_signup_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_type text NOT NULL CHECK (key_type IN ('ip', 'email_hash')),
  key_hash text NOT NULL,
  bucket_start timestamptz NOT NULL,
  attempt_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT volunteer_signup_rate_limits_unique UNIQUE (key_type, key_hash, bucket_start)
);

CREATE INDEX IF NOT EXISTS volunteer_signup_rate_limits_lookup_idx
ON public.volunteer_signup_rate_limits (key_type, key_hash, bucket_start);

ALTER TABLE public.volunteer_signup_rate_limits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.volunteer_signup_rate_limits FROM anon;
REVOKE ALL ON TABLE public.volunteer_signup_rate_limits FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.volunteer_signup_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.bump_volunteer_signup_rate_limit(
  p_key_type text,
  p_key_hash text,
  p_bucket_start timestamptz
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt_count integer;
BEGIN
  INSERT INTO public.volunteer_signup_rate_limits (
    key_type,
    key_hash,
    bucket_start,
    attempt_count,
    updated_at
  )
  VALUES (
    p_key_type,
    p_key_hash,
    p_bucket_start,
    1,
    now()
  )
  ON CONFLICT (key_type, key_hash, bucket_start)
  DO UPDATE SET
    attempt_count = public.volunteer_signup_rate_limits.attempt_count + 1,
    updated_at = now()
  RETURNING attempt_count INTO v_attempt_count;

  RETURN v_attempt_count;
END;
$$;

REVOKE ALL ON FUNCTION public.bump_volunteer_signup_rate_limit(text, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bump_volunteer_signup_rate_limit(text, text, timestamptz) TO service_role;

COMMIT;
