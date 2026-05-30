# Netlify usage monitor — setup

A weekly **cost-drift watchdog**: queries Netlify usage, emails a digest, and alerts
immediately when a metric approaches its quota. Runs on **GitHub Actions** (free CI
minutes — deliberately NOT on Netlify, so it doesn't add to the function-invocation
meter it watches).

- Script: `scripts/netlify-usage-monitor.mjs`
- Workflow: `.github/workflows/netlify-usage-monitor.yml` (Mondays 13:00 UTC + manual run)

## ⚠️ Honest limitation (read this first)

**Netlify has no officially documented usage API.** Verified 2026-05-30:
- **Bandwidth IS queryable** via an *undocumented* endpoint
  `GET /api/v1/accounts/<team_slug>/bandwidth` → `{ used, included, additional,
  period_start_date, period_end_date }` (bytes; limits are GiB = 2³⁰).
- **Build minutes + function invocations are NOT reliably exposed** by the API. Netlify
  support's own guidance is "inspect the network calls the dashboard UI makes." The
  monitor probes the sibling paths and reports them **honestly as "unavailable"** rather
  than inventing a number — for those, glance at the dashboard (**Billing → Account usage
  insights**). The monitor's email says exactly this.

Because it depends on an undocumented endpoint, an API failure is treated as **🚨 CRITICAL**
(emails you to check manually) — a broken monitor is never allowed to look healthy.

## What it reports

Per metric: `✅` (<70%), `⚠️` (≥70%), `🚨` (≥90% or API error), `❓` (not exposed by the API).
- **Bandwidth** — used / included (GiB) + % + period reset date.
- **Build minutes** — if the API exposes it on your plan; else `❓ unavailable`.
- **Function invocations** — `❓ unavailable` (with a note: keep-warm worst case ≈52K/mo,
  Pro includes 125K).

## Two places config lives (this matters)

The monitor reads the **same env var names** in two contexts:
- **Locally** (you testing): from a gitignored **`.env`** at the repo root —
  `node --env-file=.env scripts/netlify-usage-monitor.mjs`. Template in `.env.sample`.
- **In production** (the weekly run): from **GitHub repo secrets**. The GitHub Action does
  NOT read `.env` (it's gitignored, never reaches CI) — it injects secrets as env.

**⚠️ These do NOT go in Netlify env vars.** The monitor runs in GitHub Actions, not on
Netlify — putting a Netlify admin token into a Netlify build env would be pointless and a
security smell. The only Netlify-side variable in this whole feature is the optional
keep-warm kill switch `KEEP_WARM_DISABLED=1` (set in the Netlify UI).

## Setup (one-time)

1. **Netlify personal access token:** Netlify → User settings → Applications → *New access
   token*. Copy it.
2. **Team slug:** the account's "random-gibberish" slug — Netlify URL
   `app.netlify.com/teams/<THIS>/...`, or Team settings → General.
3. **Mailgun:** your existing account — grab the **private API key**, your **sending domain**
   (e.g. `mg.icjia.illinois.gov`), and note your **region** (US or EU).
4. **Local testing:** copy `.env.sample` → `.env` and fill the values, then:
   `node --env-file=.env scripts/netlify-usage-monitor.mjs` (prints the report; emails if
   Mailgun keys are set). `.env` is gitignored.
5. **Add GitHub repo secrets** (Settings → Secrets and variables → Actions) — same names:
   | Secret | Value |
   |---|---|
   | `NETLIFY_AUTH_TOKEN` | the token from step 1 |
   | `NETLIFY_TEAM_SLUG` | the slug from step 2 |
   | `MAILGUN_API_KEY` | Mailgun private API key |
   | `MAILGUN_DOMAIN` | Mailgun sending domain |
   | `MAILGUN_REGION` | `us` (default) or `eu` |
   | `ALERT_EMAIL_TO` | where alerts go (your email) |
   | `ALERT_EMAIL_FROM` | *(optional)* defaults to `ICJIA Monitor <monitor@MAILGUN_DOMAIN>` |
6. **Test it now:** GitHub → Actions → *Netlify usage monitor* → *Run workflow*. Check the
   run log + your inbox.

## Tuning (workflow env)

- `ALERT_MODE`: `digest-and-alerts` (default — weekly email always + alerts) or `alerts-only`
  (silent unless ≥WARN or an API error).
- `WARN_PCT` / `CRIT_PCT`: default `70` / `90`.
- Cadence: edit the `cron` in the workflow.
- Email: **Mailgun** (US/EU region via `MAILGUN_REGION`).

## No-email fallback

If the Resend secrets are absent, the script **prints** the report to the Actions log instead
of failing — so you can run it manually and read the log without any email setup.
