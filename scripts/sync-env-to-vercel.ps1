# Sync non-empty .env.local values to Vercel production.
# Usage (same PowerShell window):
#   cd dextgo-web
#   $env:VERCEL_TOKEN = "paste_diana_vercel_token"
#   .\scripts\sync-env-to-vercel.ps1
#
# Optional: pass token on the command line
#   .\scripts\sync-env-to-vercel.ps1 -Token "paste_diana_vercel_token"

param(
  [string]$Token = $env:VERCEL_TOKEN,
  [string]$Team = "diana-cotfas-projects",
  [string]$EnvFile = ".env.local"
)

function Invoke-VercelCli {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments,
    [switch]$AllowFailure
  )

  # Vercel CLI logs to stderr; don't let PowerShell treat that as a terminating error.
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & npx vercel @Arguments 2>&1 | ForEach-Object { Write-Host $_ }
  $exit = $LASTEXITCODE
  $ErrorActionPreference = $prev

  if (-not $AllowFailure -and $exit -ne 0) {
    throw "vercel $($Arguments -join ' ') failed (exit $exit)"
  }

  return $exit
}

if ([string]::IsNullOrWhiteSpace($Token)) {
  throw @"
VERCEL_TOKEN is not set.

Run this first in the SAME PowerShell window:
  `$env:VERCEL_TOKEN = "paste_diana_vercel_token"

Then run:
  .\scripts\sync-env-to-vercel.ps1
"@
}

$env:XDG_DATA_HOME = "$env:LOCALAPPDATA\Temp\vercel-xdg"
$env:VERCEL_TOKEN = $Token

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$envPath = Join-Path $root $EnvFile
if (-not (Test-Path $envPath)) {
  throw "Env file not found: $envPath"
}

Write-Host "Checking Vercel auth..."
Invoke-VercelCli @("whoami", "--scope", $Team, "--token", $Token) | Out-Null

$skip = @(
  "SUPABASE_PROJECT_REF",
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_DB_PASSWORD"
)

$lines = Get-Content $envPath | Where-Object {
  $_ -and -not $_.StartsWith("#") -and $_.Contains("=")
}

if ($lines.Count -eq 0) {
  throw "No env entries found in $EnvFile"
}

foreach ($line in $lines) {
  $parts = $line -split "=", 2
  $name = $parts[0].Trim()
  $value = $parts[1]

  if ($skip -contains $name -or [string]::IsNullOrWhiteSpace($value)) {
    continue
  }

  Write-Host "Syncing $name ..."

  # OK if the variable did not exist yet.
  Invoke-VercelCli @(
    "env", "rm", $name, "production",
    "--yes", "--scope", $Team, "--token", $Token
  ) -AllowFailure | Out-Null

  Invoke-VercelCli @(
    "env", "add", $name, "production",
    "--value", $value, "--yes", "--scope", $Team, "--token", $Token
  ) | Out-Null
}

Write-Host ""
Write-Host "Done. Redeploy production for changes to take effect:"
Write-Host '  Invoke-RestMethod -Method POST -Uri "https://api.vercel.com/v1/integrations/deploy/prj_DEGnmKCo9S7tw60rhx7lCCtC6P02/fNWapzn9p3"'
