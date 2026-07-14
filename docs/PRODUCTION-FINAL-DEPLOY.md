# DEXTGO — Final production deploy (CLI + Supabase checklist)

Use this after code changes are ready. You deploy with **Diana’s Vercel token**; no dashboard seat required.

---

## A. What this release fixes (code)

| Issue | Fix |
|-------|-----|
| Favicon (Vercel triangle) | Generated Dextgo icon (`icon.png`, `apple-icon.png`, `/brand/dextgo-icon.png`) |
| Auth redirects to staging | App ignores `dextgo.imjunaidafzal.com`; uses `https://dextgo.com` |
| Your email on notifications | Removed from routing; only `CONTACT_NOTIFICATION_EMAILS` + `RESEND_INBOX_EMAIL` |
| PDF on mobile | Full PDF route restored + smaller serverless bundle |
| Stripe checkout URL | Uses `getPublicSiteUrl()` → `https://dextgo.com` |

**You still must update Supabase Auth in the dashboard** (magic links are generated there).

---

## B. Supabase Auth (Diana or you with project access)

Open: https://supabase.com/dashboard/project/mgvqfkdutmcootoxqxvl/auth/url-configuration

### URL configuration

| Field | Value |
|-------|--------|
| **Site URL** | `https://dextgo.com` |
| **Redirect URLs** (add each) | `https://dextgo.com/api/auth/callback` |
| | `https://dextgo.com/api/auth/reset-password` |
| | `https://www.dextgo.com/api/auth/callback` |
| | `https://www.dextgo.com/api/auth/reset-password` |

Remove or delete any `dextgo.imjunaidafzal.com` or `localhost` entries from production allow list.

### Custom SMTP (Resend) — so magic links come from `hello@dextgo.com`

Open: **Project Settings → Auth → SMTP Settings → Enable Custom SMTP**

| Field | Value |
|-------|--------|
| Host | `smtp.resend.com` |
| Port | `465` (SSL) or `587` (TLS) |
| Username | `resend` |
| Password | Your **Resend API key** (`re_...`) |
| Sender email | `hello@dextgo.com` |
| Sender name | `DEXTGO` |

Resend domain `dextgo.com` must be verified in Resend dashboard.

---

## C. Stripe live mode

In `.env.local` (and Vercel production) confirm:

```env
STRIPE_MODE=live
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...   # from LIVE webhook endpoint
```

Live webhook URL: `https://dextgo.com/api/webhooks/stripe`

Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`

**Sandbox label on checkout** = Stripe is still in test mode on Vercel. After uploading live keys, redeploy.

Business name on checkout = **Stripe Dashboard → Settings → Business details** (Diana updates).

---

## D. Production env values (Vercel)

Minimum set (no empty strings):

```env
NEXT_PUBLIC_SITE_URL=https://dextgo.com
NEXT_PUBLIC_AUTH_REDIRECT_URL=https://dextgo.com
ADMIN_EMAILS=dianacotfas1994@gmail.com
CONTACT_NOTIFICATION_EMAILS=info@dextgo.com,dianacotfas1994@gmail.com
RESEND_INBOX_EMAIL=info@dextgo.com
RESEND_FROM_EMAIL=hello@dextgo.com
STRIPE_MODE=live
```

Do **not** include `imabug0900@gmail.com` anywhere.

---

## E. Step-by-step deploy (PowerShell)

### 0. Open terminal in app folder

```powershell
cd D:\Personal\dextgo\dextgo-web
```

If your repo root is `DEXTGO` on GitHub (flat layout), use that folder instead.

### 1. Session variables

Copy this **entire block** into PowerShell before any `vercel` command. Variables only live in the current window.

```powershell
cd D:\Personal\dextgo\dextgo-web

$env:XDG_DATA_HOME = "$env:LOCALAPPDATA\Temp\vercel-xdg"
$env:VERCEL_TOKEN = "PASTE_DIANA_VERCEL_TOKEN"
$VERCEL_TEAM = "diana-cotfas-projects"
$DEPLOY_HOOK = "https://api.vercel.com/v1/integrations/deploy/prj_DEGnmKCo9S7tw60rhx7lCCtC6P02/fNWapzn9p3"

# Sanity check — must print Diana's team/user, not an error
npx vercel whoami --scope $VERCEL_TEAM --token $env:VERCEL_TOKEN
```

If you see `option requires argument: --scope`, you skipped this block or opened a new terminal.

### 2. Verify build locally

```powershell
npm run lint
npm run build
```

### 3. Generate favicon (if brand logo changed)

```powershell
node scripts/generate-favicon.mjs
```

### 4. Commit and push (author must be Diana)

```powershell
git config user.email "dianacotfas1994@gmail.com"
git config user.name "Diana Cotfas"

git add .
git status
git commit -m "fix: production URLs, favicon, email routing, PDF mobile" --author="Diana Cotfas <dianacotfas1994@gmail.com>"
git push origin main
```

If `origin` is not Diana’s repo:

```powershell
git remote add diana https://github.com/DianaCotfas/DEXTGO.git
git push diana main
```

### 5. Sync env vars to Vercel (from `.env.local`)

**Recommended — one script, hard to mess up:**

```powershell
# After section 1 (VERCEL_TOKEN must be set)
.\scripts\sync-env-to-vercel.ps1
```

**Manual loop** (only if you already ran section 1 and `vercel whoami` works):

```powershell
if ([string]::IsNullOrWhiteSpace($env:VERCEL_TOKEN)) {
  throw 'Set $env:VERCEL_TOKEN first (see section 1)'
}

$skip = @('SUPABASE_PROJECT_REF','SUPABASE_ACCESS_TOKEN','SUPABASE_DB_PASSWORD')
Get-Content '.env.local' | Where-Object { $_ -and -not $_.StartsWith('#') -and $_.Contains('=') } | ForEach-Object {
  $parts = $_ -split '=', 2
  $name = $parts[0].Trim()
  $value = $parts[1]
  if ($skip -contains $name -or [string]::IsNullOrWhiteSpace($value)) { return }
  Write-Host "Syncing $name ..."
  npx vercel env rm $name production --yes --scope $VERCEL_TEAM --token $env:VERCEL_TOKEN 2>$null
  npx vercel env add $name production --value $value --yes --scope $VERCEL_TEAM --token $env:VERCEL_TOKEN
}
```

### 5a. Update one credential only (e.g. `OPENAI_API_KEY`)

After editing the value in `.env.local`, run **§1** (session vars), then:

```powershell
$NAME = "OPENAI_API_KEY"
$val = (Get-Content '.env.local' | Where-Object { $_ -match "^${NAME}=" }) -replace "^${NAME}=",''
if ([string]::IsNullOrWhiteSpace($val)) { throw "No value for $NAME in .env.local" }

npx vercel env rm $NAME production --yes --scope $VERCEL_TEAM --token $env:VERCEL_TOKEN
npx vercel env add $NAME production --value $val --yes --scope $VERCEL_TEAM --token $env:VERCEL_TOKEN
```

Change `$NAME` for other keys (`R2_ACCESS_KEY_ID`, `STRIPE_SECRET_KEY`, etc.).  
If you also changed `AUDIO_PROVIDER`, `OPENAI_TTS_VOICE`, or `OPENAI_TTS_MODEL`, repeat for each name.

### 5b. View / verify that credential on Vercel

```powershell
# Confirm it exists on production
npx vercel env ls production --scope $VERCEL_TEAM --token $env:VERCEL_TOKEN | Select-String $NAME

# Read the stored value (temp file — do not commit)
$CHECK = ".env.vercel.check"
npx vercel env pull $CHECK --environment=production --yes --scope $VERCEL_TEAM --token $env:VERCEL_TOKEN
$remote = (Get-Content $CHECK | Where-Object { $_ -match "^${NAME}=" }) -replace "^${NAME}=",''
Remove-Item $CHECK -ErrorAction SilentlyContinue

if ([string]::IsNullOrWhiteSpace($remote)) {
  Write-Host "$NAME is missing on Vercel production"
} else {
  Write-Host "$NAME on Vercel: $($remote.Substring(0, [Math]::Min(8, $remote.Length)))... ($($remote.Length) chars)"
  # Full value locally only: Write-Host $remote
}

$local = (Get-Content '.env.local' | Where-Object { $_ -match "^${NAME}=" }) -replace "^${NAME}=",''
if ($local -eq $remote) { Write-Host "OK: .env.local matches Vercel" } else { Write-Host "Mismatch — re-run step 5a" }
```

**You must redeploy** (step 6) — Vercel does not apply new env values to the running site until the next production build.

### 6. Trigger production deploy

```powershell
Invoke-RestMethod -Method POST -Uri $DEPLOY_HOOK
```

### 7. Wait until Ready

```powershell
npx vercel ls dextgo --scope $VERCEL_TEAM --token $env:VERCEL_TOKEN
```

When the latest row shows **Ready**, continue.

### 8. Smoke test

```powershell
Invoke-WebRequest -Uri "https://dextgo.com" -UseBasicParsing | Select-Object StatusCode
Invoke-WebRequest -Uri "https://www.dextgo.com" -UseBasicParsing | Select-Object StatusCode
```

Browser checks:

- Padlock on `https://dextgo.com`
- Favicon = Dextgo “D” (hard refresh: Ctrl+Shift+R)
- Login → magic link → stays on `dextgo.com`
- Checkout → **no** “Sandbox” if live keys are set
- PDF download on phone (signed in, purchased itinerary)
- Submit contact form → email only to `info@` and Diana

---

## F. If PDF deploy fails (>300MB function)

Error in logs: `Function "api/itineraries/[slug]/pdf" exceeds 300mb`

1. Confirm `next.config.ts` has `outputFileTracingExcludes` and `serverExternalPackages`.
2. Redeploy.
3. If still failing, tell Junaid — may need external PDF worker.

---

## G. DNS (Namecheap) — reference

| Type | Host | Value |
|------|------|--------|
| A | `@` | `216.150.1.1` |
| A | `@` | `216.150.16.1` |
| CNAME | `www` | `cname.vercel-dns.com` |

No URL Redirect on `@`.

---

## H. Message for Diana (copy/paste)

```
Hi Diana,

Production updates are ready to deploy:

1. Supabase Auth → Site URL: https://dextgo.com
   Redirect URLs: https://dextgo.com/api/auth/callback (and www variants)
   Remove dextgo.imjunaidafzal.com from redirect list.

2. Supabase → Auth → SMTP: use Resend (smtp.resend.com, user: resend, password: API key, from hello@dextgo.com)

3. Stripe: we're switching Vercel env to live keys — checkout will stop showing Sandbox after deploy.
   Please update your public business name in Stripe Dashboard → Settings.

4. Notifications now go only to info@dextgo.com and your Gmail (developer CC removed).

5. Favicon, mobile PDF, and auth redirects are fixed in code — deploying now.

Thank you!
```

---

*See also: `docs/VERCEL-CLI-DEPLOYMENT-GUIDE.md` for ongoing operations.*
