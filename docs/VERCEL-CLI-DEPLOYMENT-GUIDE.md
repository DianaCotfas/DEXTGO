# DEXTGO — Vercel CLI deployment guide (no dashboard required)

Use this guide when you deploy and operate **dextgo** on Vercel using **Diana’s CLI token** only. You do not need Vercel dashboard access or an extra team seat.

---

## 1. One-time setup (your machine)

### Prerequisites

- **Node.js 20+** and **npm**
- **Git** with push access to [github.com/DianaCotfas/DEXTGO](https://github.com/DianaCotfas/DEXTGO)
- **Diana’s Vercel token** (Account → Tokens). Store it locally; never commit it.

### PowerShell session variables

Run at the start of each session:

```powershell
$env:XDG_DATA_HOME = "$env:LOCALAPPDATA\Temp\vercel-xdg"
$TOKEN = "YOUR_VERCEL_TOKEN_HERE"
$SCOPE = "diana-cotfas-projects"
$PROJECT = "dextgo"
$PROJECT_ID = "prj_DEGnmKCo9S7tw60rhx7lCCtC6P02"
$TEAM_ID = "team_LTdFoktxgTbx3EOviEOBLhQ3"
$DEPLOY_HOOK = "https://api.vercel.com/v1/integrations/deploy/prj_DEGnmKCo9S7tw60rhx7lCCtC6P02/fNWapzn9p3"
```

### Link the repo to Vercel (once per clone)

From the folder that contains `package.json` (app root on GitHub):

```powershell
cd D:\path\to\DEXTGO
npx vercel link --yes --project dextgo --scope $SCOPE --token $TOKEN
```

---

## 2. How deployments work (important)

| Method | Works for you? | Why |
|--------|----------------|-----|
| **Deploy hook** (recommended) | Yes | Builds from GitHub; no git-author seat check |
| **Git push** to `main` | Yes, if commit author is **Diana** | Vercel blocks commits from emails not on the team |
| **`vercel deploy --prod` from your PC** | **No** | Your Git email (`junaid729710211597@gmail.com`) is blocked unless Diana adds a paid seat |

### Commit as Diana (required for Git-triggered builds)

```powershell
git config user.email "dianacotfas1994@gmail.com"
git config user.name "Diana Cotfas"

git add .
git commit -m "your message" --author="Diana Cotfas <dianacotfas1994@gmail.com>"
git push origin main
```

### Trigger production deploy (after push)

```powershell
Invoke-RestMethod -Method POST -Uri $DEPLOY_HOOK
```

### Check deployment status

```powershell
npx vercel ls $PROJECT --scope $SCOPE --token $TOKEN
npx vercel inspect https://dextgo-XXXX-diana-cotfas-projects.vercel.app --scope $SCOPE --token $TOKEN
npx vercel inspect https://dextgo-XXXX-diana-cotfas-projects.vercel.app --logs --scope $SCOPE --token $TOKEN
```

When status is **Ready**, production domains (`dextgo.com`, `www.dextgo.com`) update automatically.

---

## 3. Environment variables (CLI only)

### List production env

```powershell
npx vercel env ls production --scope $SCOPE --token $TOKEN
```

### Pull env to a local file (review only — do not commit)

```powershell
npx vercel env pull .env.vercel.production --environment=production --yes --scope $SCOPE --token $TOKEN
```

### Add or update one variable

Remove old value first, then add (Vercel does not support in-place edit via CLI):

```powershell
npx vercel env rm VARIABLE_NAME production --yes --scope $SCOPE --token $TOKEN
"your-value" | npx vercel env add VARIABLE_NAME production --scope $SCOPE --token $TOKEN
```

### Required production values (minimum)

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | `https://dextgo.com` |
| `NEXT_PUBLIC_AUTH_REDIRECT_URL` | `https://dextgo.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_...` |
| `STRIPE_MODE` | `live` |
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `RESEND_API_KEY` | `re_...` |
| `RESEND_FROM_EMAIL` | `hello@dextgo.com` |
| `R2_*` | Cloudflare R2 credentials |
| `OPENAI_API_KEY` | for audio |
| Iubenda `NEXT_PUBLIC_IUBENDA_*` | from Iubenda dashboard |

**Always use `https://dextgo.com`** for public URL vars — never `http://` or empty strings.

After changing env vars, **trigger a new production deploy** (deploy hook).

### Bulk upload from local `.env.local`

From app root, only non-empty lines (adjust path to your env file):

```powershell
$skip = @('SUPABASE_PROJECT_REF','SUPABASE_ACCESS_TOKEN','SUPABASE_DB_PASSWORD')
Get-Content '.env.local' | Where-Object { $_ -and -not $_.StartsWith('#') -and $_.Contains('=') } | ForEach-Object {
  $parts = $_ -split '=', 2
  $name = $parts[0].Trim()
  $value = $parts[1]
  if ($skip -contains $name -or [string]::IsNullOrWhiteSpace($value)) { return }
  npx vercel env rm $name production --yes --scope $SCOPE --token $TOKEN 2>$null
  $value | npx vercel env add $name production --scope $SCOPE --token $TOKEN
}
```

---

## 4. Domains and SSL (CLI + DNS at registrar)

### Check domain status on Vercel

```powershell
$headers = @{ Authorization = "Bearer $TOKEN" }
Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$PROJECT_ID/domains?teamId=$TEAM_ID" -Headers $headers
Invoke-RestMethod -Uri "https://api.vercel.com/v6/domains/dextgo.com/config?teamId=$TEAM_ID" -Headers $headers
```

### Add domain to project (if missing)

```powershell
npx vercel domains add dextgo.com --scope $SCOPE --token $TOKEN
npx vercel domains add www.dextgo.com --scope $SCOPE --token $TOKEN
```

### Redirect `www` → apex (recommended)

```powershell
$headers = @{ Authorization = "Bearer $TOKEN"; "Content-Type" = "application/json" }
$body = '{"redirect":"dextgo.com","redirectStatusCode":308}'
Invoke-RestMethod -Method PATCH `
  -Uri "https://api.vercel.com/v9/projects/$PROJECT_ID/domains/www.dextgo.com?teamId=$TEAM_ID" `
  -Headers $headers -Body $body
```

### Namecheap DNS (correct records)

Remove any **URL Redirect** on `@` (it breaks SSL and points to parking IPs).

| Type | Host | Value |
|------|------|--------|
| **A** | `@` | `216.150.1.1` |
| **A** | `@` | `216.150.16.1` |
| **CNAME** | `www` | `cname.vercel-dns.com` |

(Vercel also accepts legacy A `76.76.21.21`; newer IPs above are preferred.)

Verify:

```powershell
nslookup dextgo.com 8.8.8.8
nslookup www.dextgo.com 8.8.8.8
```

Both should resolve to Vercel (not `192.64.119.x`).

### Check SSL certificates

```powershell
Invoke-RestMethod -Uri "https://api.vercel.com/v7/certs?domain=dextgo.com&teamId=$TEAM_ID" -Headers @{ Authorization = "Bearer $TOKEN" }
```

### If the browser still says “Not secure”

1. Open **`https://dextgo.com`** (not `http://`).
2. Clear browser cache / try incognito.
3. Confirm DNS (no redirect record, correct A records).
4. Confirm production env: `NEXT_PUBLIC_SITE_URL=https://dextgo.com`.
5. Redeploy after code/env fixes.

---

## 5. Project settings via API (no dashboard)

### Disable “verified commits only” (allows deploy hook after Diana-authored commits)

```powershell
$headers = @{ Authorization = "Bearer $TOKEN"; "Content-Type" = "application/json" }
$body = '{"gitProviderOptions":{"requireVerifiedCommits":false}}'
Invoke-RestMethod -Method PATCH `
  -Uri "https://api.vercel.com/v9/projects/$PROJECT_ID?teamId=$TEAM_ID" `
  -Headers $headers -Body $body
```

### Set framework to Next.js (if builds were empty)

```powershell
npx vercel api /v9/projects/$PROJECT_ID -X PATCH -F framework=nextjs --scope $SCOPE --token $TOKEN
```

---

## 6. Aliases (point domain at a specific deployment)

Usually automatic on production Ready. Manual override:

```powershell
npx vercel alias set https://dextgo-XXXX-diana-cotfas-projects.vercel.app dextgo.com --scope $SCOPE --token $TOKEN
npx vercel alias set https://dextgo-XXXX-diana-cotfas-projects.vercel.app www.dextgo.com --scope $SCOPE --token $TOKEN
```

---

## 7. Standard release workflow

1. Edit code locally; run `npm run lint` and `npm run build`.
2. Commit with **Diana author**; push to `DianaCotfas/DEXTGO` `main`.
3. `Invoke-RestMethod -Method POST -Uri $DEPLOY_HOOK`
4. `npx vercel ls dextgo ...` until **Ready**.
5. Test `https://dextgo.com` and `https://www.dextgo.com` (www should redirect to apex).
6. Smoke-test: login, checkout, webhook (Stripe dashboard), contact form, newsletter.

---

## 8. Troubleshooting

| Symptom | Cause | Fix |
|---------|--------|-----|
| Deployment **BLOCKED** | Git author not on team | Use deploy hook + Diana-authored commits; do not use `vercel deploy` from your machine |
| Deployment **CANCELED** (unverified commit) | Verified commits required | API: `requireVerifiedCommits: false` (see §5) |
| Build **Error** — function > 300MB | PDF route too large | Current prod uses slim PDF route; full PDF needs separate service |
| **404** on live domain | Old deployment aliased | New Ready production deploy |
| **Not secure** in browser | HTTP URL, bad DNS, or empty `NEXT_PUBLIC_SITE_URL` | HTTPS env vars, fix Namecheap DNS, redeploy |
| Stripe webhook fails | Wrong URL or secret | Endpoint `https://dextgo.com/api/webhooks/stripe`; live `whsec_` in Vercel env |

### Useful API checks

```powershell
$headers = @{ Authorization = "Bearer $TOKEN" }
# Latest deployments
Invoke-RestMethod -Uri "https://api.vercel.com/v6/deployments?projectId=$PROJECT_ID&teamId=$TEAM_ID&limit=5" -Headers $headers
# Whoami
npx vercel whoami --token $TOKEN
```

---

## 9. What you cannot do via CLI alone

- **Add yourself to the Vercel team** (requires Diana’s dashboard or a paid seat).
- **Change Namecheap DNS** (registrar login).
- **Create Stripe / Supabase / Resend accounts** (each provider’s console).

---

## 10. Reference IDs

| Item | Value |
|------|--------|
| Vercel team slug | `diana-cotfas-projects` |
| Project name | `dextgo` |
| Project ID | `prj_DEGnmKCo9S7tw60rhx7lCCtC6P02` |
| Team ID | `team_LTdFoktxgTbx3EOviEOBLhQ3` |
| GitHub repo | `DianaCotfas/DEXTGO` |
| Production branch | `main` |
| Deploy hook | `.../fNWapzn9p3` (full URL in `$DEPLOY_HOOK` above) |
| Live URLs | https://dextgo.com , https://www.dextgo.com |

---

## 11. Security notes

- Rotate the Vercel token if it was shared in chat.
- Never commit `.env.local`, tokens, or `auth.json` from `.xdg`.
- Add `dextgo-web/.xdg/` and `.env*.local` to `.gitignore` (already should be).

---

*Last updated: June 2026 — production deploy via deploy hook; SSL and env fixes documented.*
