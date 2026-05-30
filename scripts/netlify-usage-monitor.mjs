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

// Collect every usage metric the API will actually give us. Each entry:
// { label, available, used, included, p, badge, note }.
async function collect() {
  const out = [];

  // 1) Bandwidth — the one endpoint that reliably exists.
  try {
    const b = await nf(`/accounts/${SLUG}/bandwidth`);
    const p = pct(b.used, b.included);
    out.push({
      label: "Bandwidth",
      available: true,
      detail: `${fmtGiB(b.used)} of ${fmtGiB(b.included)}${b.additional ? ` (+${fmtGiB(b.additional)} packs)` : ""}`,
      p,
      badge: badge(p),
      note: b.period_end_date ? `period resets ${String(b.period_end_date).slice(0, 10)}` : "",
    });
  } catch (e) {
    // errored = should work but didn't (vs available:false = not exposed by design).
    // This MUST be loud: a broken monitor can't be allowed to look healthy.
    out.push({ label: "Bandwidth", available: false, errored: true, badge: "🚨", note: `API error: ${e.message}` });
  }

  // 2) Build minutes — try the (undocumented, often-absent) sibling path; do NOT
  //    fabricate if it 404s. Report availability honestly.
  for (const [label, path] of [
    ["Build minutes", `/accounts/${SLUG}/builds/status`],
    ["Build minutes", `/${SLUG}/builds/status`],
  ]) {
    try {
      const d = await nf(path);
      const used = d.minutes_used ?? d.used ?? null;
      const included = d.included_minutes ?? d.included ?? null;
      if (used != null && included != null) {
        const p = pct(used, included);
        out.push({ label, available: true, detail: `${used} of ${included} min`, p, badge: badge(p), note: "" });
      } else {
        out.push({ label, available: true, detail: JSON.stringify(d).slice(0, 100), p: 0, badge: "ℹ️", note: "shape differs — review fields" });
      }
      break;
    } catch {
      /* try next path */
    }
  }
  if (!out.some((m) => m.label === "Build minutes")) {
    out.push({ label: "Build minutes", available: false, badge: "❓", note: "not exposed by the Netlify API — check dashboard: Billing → Account usage" });
  }

  // 3) Function invocations — not exposed by the public/undocumented API.
  out.push({
    label: "Function invocations",
    available: false,
    badge: "❓",
    note: "not exposed by the Netlify API — check dashboard: Billing → Account usage. (Our keep-warm worst case ≈52K/mo, Pro includes 125K.)",
  });

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
    return `  ${m.badge} ${m.label}: ${m.detail}${typeof m.p === "number" ? ` (${m.p}% of quota)` : ""}${m.note ? ` — ${m.note}` : ""}`;
  });

  const subject = anyErrored
    ? `🚨 Netlify usage monitor — API error (check it)`
    : worst >= WARN_PCT
      ? `${level} — Netlify usage (${worst}% of a quota)`
      : `✅ Netlify usage OK (weekly)`;

  const text = [
    `ICJIA Netlify usage report — ${level}`,
    ``,
    ...lines,
    ``,
    `Thresholds: warn ≥${WARN_PCT}%, critical ≥${CRIT_PCT}%.`,
    anyUnavailable
      ? `\nNote: some metrics aren't exposed by Netlify's API (undocumented endpoint). For those, verify in the dashboard → Billing → Account usage insights.`
      : ``,
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
