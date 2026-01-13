-- Migration: Create volunteer_signups table
-- This table stores volunteer sign-ups for opportunities

CREATE TABLE IF NOT EXISTS volunteer_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES volunteer_opportunities(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate sign-ups (same email/phone for same opportunity)
  CONSTRAINT unique_signup UNIQUE (opportunity_id, email)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_volunteer_signups_opportunity_id ON volunteer_signups(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_signups_email ON volunteer_signups(email);
CREATE INDEX IF NOT EXISTS idx_volunteer_signups_created_at ON volunteer_signups(created_at DESC);

-- Enable Row Level Security
ALTER TABLE volunteer_signups ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (sign up)
CREATE POLICY "Anyone can sign up for opportunities"
  ON volunteer_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Only authenticated users can view sign-ups (for chapter heads and admins)
-- Note: You may want to add more specific policies based on chapter_id
CREATE POLICY "Authenticated users can view sign-ups"
  ON volunteer_signups
  FOR SELECT
  TO authenticated
  USING (true);

-- Optional: Policy for chapter heads to only see sign-ups for their chapter's opportunities
-- This requires joining with volunteer_opportunities table
-- You'll need to implement this based on your RLS setup for profiles table

COMMENT ON TABLE volunteer_signups IS 'Stores volunteer sign-ups for volunteer opportunities';
COMMENT ON COLUMN volunteer_signups.opportunity_id IS 'References the volunteer opportunity';
COMMENT ON COLUMN volunteer_signups.full_name IS 'Full name of the volunteer';
COMMENT ON COLUMN volunteer_signups.email IS 'Email address of the volunteer';
COMMENT ON COLUMN volunteer_signups.phone IS 'Phone number of the volunteer';
COMMENT ON COLUMN volunteer_signups.message IS 'Optional message from the volunteer';
