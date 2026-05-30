#!/usr/bin/env node
// Netlify usage monitor — weekly digest + threshold alerts, so we catch cost
// drift / overages before they bite. Runs in CI (GitHub Actions), NOT on Netlify
// (so it doesn't add to the very function-invocation meter it's watching).
//
// ── IMPORTANT REALITY (verified 2026-05-30) ──────────────────────────────────
// Netlify has NO officially documented usage API. The dashboard reads an
// UNDOCUMENTED endpoint: GET /api/v1/accounts/<team_slug>/bandwidth →
// { used, included, additional, period_start_date, period_end_date } (bytes;
// limits are GiB = 2^30). Build minutes + function invocations are NOT reliably
// exposed by the API (Netlify support: "inspect the UI's network calls"). So this
// monitor reports what the API ACTUALLY returns and is honest about the rest:
// it probes the sibling usage paths and includes whatever exists, flagging any
// metric the API doesn't expose as "unavailable" rather than inventing a number.
//
// Because it relies on an undocumented endpoint, a fetch failure is treated as a
// NOTICE (email you to check manually), never a silent pass.
//
// ENV (GitHub Actions secrets):
//   NETLIFY_AUTH_TOKEN   personal access token (user settings → applications)
//   NETLIFY_TEAM_SLUG    team/account slug (the "random-gibberish" account name)
//   MAILGUN_API_KEY      Mailgun private API key
//   MAILGUN_DOMAIN       Mailgun sending domain (e.g. mg.icjia.illinois.gov)
//   MAILGUN_REGION       "us" (default) | "eu"  — picks api.mailgun.net vs api.eu.mailgun.net
//   ALERT_EMAIL_TO       recipient
//   ALERT_EMAIL_FROM     sender (optional; defaults to "ICJIA Monitor <monitor@MAILGUN_DOMAIN>")
//   ALERT_MODE           "digest-and-alerts" (default) | "alerts-only"
//   WARN_PCT / CRIT_PCT  thresholds (default 70 / 90)

const API = "https://api.netlify.com/api/v1";
const TOKEN = process.env.NETLIFY_AUTH_TOKEN;
const SLUG = process.env.NETLIFY_TEAM_SLUG;
const WARN_PCT = Number(process.env.WARN_PCT || 70);
const CRIT_PCT = Number(process.env.CRIT_PCT || 90);
const MODE = process.env.ALERT_MODE || "digest-and-alerts";
const GiB = 2 ** 30;

function need(name, val) {
  if (!val) {
    console.error(`Missing required env: ${name}`);
    process.exit(2);
  }
}
need("NETLIFY_AUTH_TOKEN", TOKEN);
need("NETLIFY_TEAM_SLUG", SLUG);

async function nf(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GET ${path} → ${res.status} ${res.statusText} ${body.slice(0, 120)}`);
  }
  return res.json();
}

function fmtGiB(bytes) {
  return (bytes / GiB).toFixed(2) + " GiB";
}
function pct(used, included) {
  return included > 0 ? Math.round((used / included) * 100) : 0;
}
function badge(p) {
  if (p >= CRIT_PCT) return "🚨";
  if (p >= WARN_PCT) return "⚠️";
  return "✅";
}

function fmtInt(n) {
  return Number(n).toLocaleString("en-US");
}

// Collect usage from the live API. Primary source = GET /accounts/{slug}, whose
// `capabilities` map carries {included, used} for functions, edge_functions,
// bandwidth, build_minutes, and compute (functions_gb_hour / builds_gb_hour) — all
// verified live 2026-05-30. We enrich a couple of metrics from their dedicated
// endpoints (richer detail + the PREVIOUS period for context).
async function collect() {
  const out = [];

  // --- account capabilities (the one call that has everything) ---
  let caps = null;
  let periodReset = "";
  let periodStart = "";
  let periodEnd = "";
  try {
    const acct = await nf(`/accounts/${SLUG}`);
    caps = acct.capabilities || {};
    periodStart = acct.current_usage_period_start || "";
    periodEnd = acct.next_usage_period_start || "";
    periodReset = periodEnd ? String(periodEnd).slice(0, 10) : "";
  } catch (e) {
    out.push({
      label: "Account usage",
      available: false,
      errored: true,
      badge: "🚨",
      note: `API error fetching /accounts/${SLUG}: ${e.message}`,
    });
  }

  const cap = (k) => (caps && caps[k] && typeof caps[k].included === "number" ? caps[k] : null);
  const resetNote = periodReset ? `resets ${periodReset}` : "";

  // Fraction of the billing period ELAPSED (for linear usage projection). Plain
  // Node script (not a Workflow), so Date.now() is fine here.
  let elapsed = null;
  if (periodStart && periodEnd) {
    const s = new Date(periodStart).getTime();
    const e = new Date(periodEnd).getTime();
    const now = Date.now();
    if (e > s) elapsed = Math.min(1, Math.max(0, (now - s) / (e - s)));
  }
  // Project end-of-period total from current pace; null if too early to be useful.
  const project = (used) => {
    if (elapsed == null || elapsed < 0.05 || used == null) return null;
    return Math.round(used / elapsed);
  };

  // helper to push a quota metric with raw values + projection
  const pushMetric = (label, used, included, fmt, extraNote = "") => {
    const p = pct(used, included);
    out.push({
      label,
      available: true,
      used,
      included,
      projected: project(used),
      fmt, // fmt(n) → display string
      detail: `${fmt(used)} of ${fmt(included)}`,
      p,
      badge: badge(p),
      note: [extraNote, resetNote].filter(Boolean).join(" · "),
    });
  };

  // 1) Function invocations — THE metric you care most about.
  const fn = cap("functions");
  if (fn) pushMetric("Function invocations", fn.used, fn.included, fmtInt);
  else if (caps) out.push({ label: "Function invocations", available: false, badge: "❓", note: "not present in capabilities — check dashboard" });

  // 2) Edge function invocations.
  const ef = cap("edge_functions");
  if (ef) pushMetric("Edge function invocations", ef.used, ef.included, fmtInt);

  // 3) Function compute (GB-hours).
  const fgh = cap("functions_gb_hour");
  if (fgh) pushMetric("Function compute (GB-hr)", fgh.used, fgh.included, (n) => `${fmtInt(n)} GB-hr`);

  // 4) Bandwidth — capabilities has it, but the dedicated endpoint adds packs +
  //    exact reset date, so prefer it and fall back to capabilities.
  try {
    const b = await nf(`/accounts/${SLUG}/bandwidth`);
    const p = pct(b.used, b.included);
    out.push({
      label: "Bandwidth",
      available: true,
      used: b.used,
      included: b.included,
      projected: project(b.used),
      fmt: fmtGiB,
      detail: `${fmtGiB(b.used)} of ${fmtGiB(b.included)}${b.additional ? ` (+${fmtGiB(b.additional)} packs)` : ""}`,
      p,
      badge: badge(p),
      note: b.period_end_date ? `resets ${String(b.period_end_date).slice(0, 10)}` : resetNote,
    });
  } catch {
    const bw = cap("bandwidth");
    if (bw) pushMetric("Bandwidth", bw.used, bw.included, fmtGiB);
  }

  // 5) Build minutes — dedicated endpoint adds the PREVIOUS period (context).
  for (const path of [`/${SLUG}/builds/status`, `/accounts/${SLUG}/builds/status`]) {
    try {
      const d = await nf(path);
      const m = d.minutes || {};
      const used = m.current ?? null;
      const included = m.included_minutes_with_packs ?? m.included_minutes ?? null;
      if (used != null && included != null) {
        const p = pct(used, included);
        out.push({
          label: "Build minutes",
          available: true,
          used,
          included,
          projected: project(used),
          previous: m.previous,
          fmt: (n) => `${fmtInt(n)} min`,
          detail: `${fmtInt(used)} of ${fmtInt(included)} min`,
          p,
          badge: badge(p),
          // CONTEXT: prior period's total, so a trend is visible at a glance.
          note: [
            m.previous != null ? `prev period: ${fmtInt(m.previous)} min` : "",
            m.period_end_date ? `resets ${String(m.period_end_date).slice(0, 10)}` : "",
          ]
            .filter(Boolean)
            .join(" · "),
        });
      }
      break;
    } catch {
      /* try next path */
    }
  }
  // Fall back to capabilities build_minutes if the builds endpoint failed.
  if (!out.some((m) => m.label === "Build minutes")) {
    const bm = cap("build_minutes");
    if (bm) {
      const p = pct(bm.used, bm.included);
      out.push({ label: "Build minutes", available: true, detail: `${fmtInt(bm.used)} of ${fmtInt(bm.included)} min`, p, badge: badge(p), note: resetNote });
    } else if (caps) {
      out.push({ label: "Build minutes", available: false, badge: "❓", note: "not present — check dashboard" });
    }
  }

  return out;
}

function buildEmail(metrics) {
  const avail = metrics.filter((m) => m.available && typeof m.p === "number");
  const worst = Math.max(0, ...avail.map((m) => m.p));
  const anyUnavailable = metrics.some((m) => !m.available);
  // An errored metric (API should have answered but failed) is alert-worthy on its
  // own — otherwise a broken monitor silently reports "OK" (fail-loud, not -silent).
  const anyErrored = metrics.some((m) => m.errored);
  const level =
    worst >= CRIT_PCT || anyErrored
      ? "🚨 CRITICAL"
      : worst >= WARN_PCT
        ? "⚠️ WARNING"
        : "✅ OK";

  const lines = metrics.map((m) => {
    if (!m.available) return `  ${m.badge} ${m.label}: unavailable — ${m.note}`;
    let line = `  ${m.badge} ${m.label}: ${m.detail}${typeof m.p === "number" ? ` (${m.p}% of quota)` : ""}`;
    if (m.note) line += ` — ${m.note}`;
    // PROJECTION: linear end-of-period estimate from current pace.
    if (m.projected != null && m.fmt) {
      const projPct = pct(m.projected, m.included);
      line += `\n       ↳ projected end-of-period: ~${m.fmt(m.projected)} (~${projPct}% of quota)`;
    }
    return line;
  });

  const subject = anyErrored
    ? `🚨 Netlify usage monitor — API error (check it)`
    : worst >= WARN_PCT
      ? `${level} — Netlify usage (${worst}% of a quota)`
      : `✅ Netlify usage OK (weekly)`;

  // Direct click-through links to the Netlify dashboard (team slug from env).
  const team = process.env.NETLIFY_TEAM_SLUG || "";
  const links = team
    ? [
        ``,
        `View on Netlify:`,
        `  • Usage insights: https://app.netlify.com/teams/${team}/usage`,
        `  • Billing:        https://app.netlify.com/teams/${team}/billing`,
        `  • Functions:      https://app.netlify.com/teams/${team}/usage#functions`,
      ]
    : [];

  const text = [
    `ICJIA Netlify usage report — ${level}`,
    ``,
    ...lines,
    ``,
    `Thresholds: warn ≥${WARN_PCT}%, critical ≥${CRIT_PCT}%.`,
    `Projections are a LINEAR estimate from usage so far this period — rough, early in the period especially.`,
    anyUnavailable
      ? `\nNote: some metrics aren't exposed by Netlify's API. For those, see the dashboard → Billing → Account usage insights.`
      : ``,
    ...links,
    `\nMonitor: scripts/netlify-usage-monitor.mjs (weekly GitHub Action).`,
  ].join("\n");

  // shouldSend: alerts-only → fire when a quota is ≥WARN OR a metric errored
  // (a broken monitor must still email in alerts-only mode).
  const triggered = worst >= WARN_PCT || anyErrored;
  const shouldSend = MODE === "alerts-only" ? triggered : true;
  return { subject, text, shouldSend, triggered, worst };
}

async function sendEmail({ subject, text }) {
  const key = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN; // e.g. mg.icjia.illinois.gov
  const to = process.env.ALERT_EMAIL_TO;
  const from =
    process.env.ALERT_EMAIL_FROM || (domain ? `ICJIA Monitor <monitor@${domain}>` : "");
  // MAILGUN_REGION: "eu" → EU API host; anything else (default) → US.
  const base =
    (process.env.MAILGUN_REGION || "us").toLowerCase() === "eu"
      ? "https://api.eu.mailgun.net"
      : "https://api.mailgun.net";

  if (!key || !domain || !to || !from) {
    console.log(
      "Email not configured (MAILGUN_API_KEY/MAILGUN_DOMAIN/ALERT_EMAIL_TO[/ALERT_EMAIL_FROM]) — printing instead:\n",
    );
    console.log(subject + "\n\n" + text);
    return;
  }

  // Mailgun messages API: multipart/form-data POST to /v3/{domain}/messages,
  // HTTP basic auth with username "api" and the API key as the password.
  const form = new FormData();
  form.set("from", from);
  form.set("to", to);
  form.set("subject", subject);
  form.set("text", text);

  const res = await fetch(`${base}/v3/${domain}/messages`, {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`api:${key}`).toString("base64") },
    body: form,
  });
  if (!res.ok) {
    const b = await res.text().catch(() => "");
    throw new Error(`Mailgun → ${res.status} ${b.slice(0, 160)}`);
  }
  console.log("Email sent via Mailgun:", subject);
}

async function main() {
  let metrics;
  try {
    metrics = await collect();
  } catch (e) {
    // Total failure (e.g. bad token) → always notify so a broken monitor is loud.
    metrics = [{ label: "Monitor", available: false, badge: "🚨", note: `collection failed: ${e.message}` }];
  }
  const email = buildEmail(metrics);
  console.log(email.subject);
  console.log(email.text);
  if (email.shouldSend) await sendEmail(email);
  else console.log("\n(alerts-only mode: nothing triggered → no email sent)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
