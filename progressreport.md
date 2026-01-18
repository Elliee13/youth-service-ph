Progress Report (2026-01-19)

Summary
- Added public user registration + OAuth, plus My Account page with volunteer history.
- Implemented global toast system (bottom-right) for success/error messages.
- Fixed SPA routing for Vercel and externalized Google Forms to link-out buttons.
- Added admin success toasts for CRUD actions and improved signup duplicate messaging.

Key Changes
- Public users table migration and volunteer signups linked to user_id.
- New routes: /register and /my-account, updated header for signed-in users.
- Volunteer signup auto-fill for public accounts.

Next Steps
- Confirm RLS policies for public read access on programs, chapters, opportunities, site_settings.
- Add “public user profile” editing validations (phone/email format) and optional avatar.
- Add an admin view for volunteer signups (search/filter by opportunity/chapter).
- Run a full regression test: auth flows, CRUD, volunteer signup, and profile update.
