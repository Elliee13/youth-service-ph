# Volunteer Sign-Up Feature

## Overview
Added a complete sign-up system for volunteer opportunities, allowing users to sign up directly from the Volunteer Opportunities page.

## What Was Added

### 1. Database Table
- **File**: `DATABASE_MIGRATION_VOLUNTEER_SIGNUPS.sql`
- **Table**: `volunteer_signups`
- **Fields**:
  - `id` (UUID, primary key)
  - `opportunity_id` (UUID, references volunteer_opportunities)
  - `full_name` (TEXT, required)
  - `email` (TEXT, required)
  - `phone` (TEXT, required)
  - `message` (TEXT, optional)
  - `created_at` (TIMESTAMPTZ)

### 2. API Function
- **File**: `src/lib/public.api.ts`
- **Function**: `signUpForOpportunity(input: VolunteerSignupInput)`
- **Purpose**: Handles volunteer sign-ups and stores them in the database

### 3. Sign-Up Modal Component
- **File**: `src/components/volunteer/SignUpModal.tsx`
- **Features**:
  - Form with full name, email, phone, and optional message
  - Validation for required fields
  - Error handling
  - Success callback
  - Modal overlay with backdrop

### 4. Updated Volunteer Opportunities Page
- **File**: `src/pages/VolunteerOpportunities.tsx`
- **Changes**:
  - Added "Sign Up Now" button on each opportunity card
  - Integrated SignUpModal component
  - Added success message toast notification
  - Modal state management

## Setup Instructions

### Step 1: Run Database Migration

Execute the SQL migration in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of DATABASE_MIGRATION_VOLUNTEER_SIGNUPS.sql
```

Or run it via Supabase CLI:
```bash
supabase db push
```

### Step 2: Verify Table Creation

Check that the table was created:
```sql
SELECT * FROM volunteer_signups LIMIT 1;
```

### Step 3: Test the Feature

1. Navigate to `/volunteer-opportunities`
2. Click "Sign Up Now" on any opportunity
3. Fill out the form and submit
4. Verify the sign-up appears in the database

## Features

### User Experience
- ✅ One-click sign-up from opportunity cards
- ✅ Clean modal form interface
- ✅ Real-time validation
- ✅ Success notification toast
- ✅ Prevents duplicate sign-ups (same email for same opportunity)

### Data Collection
- Full name
- Email address
- Phone number
- Optional message/notes

### Security
- Row Level Security (RLS) enabled
- Public can insert (sign up)
- Authenticated users can view sign-ups
- Unique constraint prevents duplicate sign-ups

## Usage

### For Users
1. Browse volunteer opportunities
2. Click "Sign Up Now" on desired opportunity
3. Fill out the form
4. Submit and receive confirmation

### For Administrators/Chapter Heads
Sign-ups are stored in the `volunteer_signups` table and can be queried:

```sql
-- View all sign-ups for a specific opportunity
SELECT * FROM volunteer_signups 
WHERE opportunity_id = '...' 
ORDER BY created_at DESC;

-- View sign-ups with opportunity details
SELECT 
  vs.*,
  vo.event_name,
  vo.event_date,
  c.name as chapter_name
FROM volunteer_signups vs
JOIN volunteer_opportunities vo ON vs.opportunity_id = vo.id
LEFT JOIN chapters c ON vo.chapter_id = c.id
ORDER BY vs.created_at DESC;
```

## Future Enhancements

Potential improvements:
1. **Email Notifications**: Send confirmation email to volunteers
2. **Admin Dashboard**: View and manage sign-ups in admin panel
3. **Chapter Head Dashboard**: View sign-ups for their chapter's opportunities
4. **Export**: Export sign-ups to CSV/Excel
5. **Reminders**: Send reminder emails before event date
6. **Capacity Limits**: Set maximum volunteers per opportunity

## Files Modified/Created

### Created Files
- `src/components/volunteer/SignUpModal.tsx` - Sign-up modal component
- `DATABASE_MIGRATION_VOLUNTEER_SIGNUPS.sql` - Database migration
- `VOLUNTEER_SIGNUP_FEATURE.md` - This documentation

### Modified Files
- `src/lib/public.api.ts` - Added sign-up API function
- `src/pages/VolunteerOpportunities.tsx` - Added sign-up UI
- `DOCUMENTATION.md` - Updated with new table and API function

## Notes

- The sign-up form is accessible to all users (no authentication required)
- Duplicate sign-ups are prevented at the database level (unique constraint on opportunity_id + email)
- The contact details from the opportunity are still displayed for manual contact
- Success message automatically appears after successful sign-up
