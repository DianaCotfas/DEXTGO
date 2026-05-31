# DEXTGO Auth Email Templates

These HTML files are ready to paste into Supabase Auth templates so login and account emails match the DEXTGO branding.

## Mapping

- `magic-link.html` -> Magic Link
- `confirm-signup.html` -> Confirm Signup
- `recovery.html` -> Reset Password
- `invite.html` -> Invite User
- `change-email.html` -> Change Email Address

## Important

- In Supabase Auth settings, keep Site URL set to your production domain.
- The logo in these templates loads from:
  `{{ .SiteURL }}/brand/dextgo-wordmark.png`
- Test each template from Supabase Dashboard after pasting.
