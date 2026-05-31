# Supabase — Local + remote sync

This folder contains DEXTGO's database schema and seed data as plain SQL.

## Apply to Diana's Supabase project

1. Open https://supabase.com/dashboard, pick the `dextgo` project.
2. SQL Editor -> New query.
3. Paste the contents of `migrations/0001_init.sql` -> Run.
4. Paste the contents of `migrations/0002_seed.sql` -> Run.
5. Authentication -> URL Configuration: add `https://dextgo.com` and the Vercel preview URLs to the allowed redirect list.
6. Authentication -> Providers: enable Email (magic link + password). Disable any provider Diana doesn't want.
7. Authentication -> Email Templates:
   - Use the branded templates in `supabase/email-templates/`.
   - Copy each file into the matching Supabase template:
     - `magic-link.html` -> Magic Link
     - `confirm-signup.html` -> Confirm Signup
     - `recovery.html` -> Reset Password
     - `invite.html` -> Invite User
     - `change-email.html` -> Change Email Address
   - Keep Site URL as `https://dextgo.com` so the logo resolves:
     `https://dextgo.com/brand/dextgo-wordmark.png`
8. Make Diana's account an admin: in SQL Editor, run
   ```sql
   update public.profiles set is_admin = true where email = 'diana@dextgo.com';
   ```
   (replace with the actual address she uses to sign up).

## Local development

We don't run Supabase locally — every developer connects to the cloud project using the keys in `.env.local`. This keeps schema/migrations consistent and avoids drift.

When the schema changes, write a new file `migrations/000N_<name>.sql` and apply it through the dashboard.
