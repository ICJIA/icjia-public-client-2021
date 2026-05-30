// Drop-in replacement for the Apollo client that was configured in
// src/vue-apollo.js. Uses plain fetch() against the Strapi GraphQL
// endpoint and preserves the behavior that was actually in use on this
// site: in-memory response cache, per-query fetchPolicy control, and
// the deepSanitize afterware that filters every string in every
// response through @/utils/contentSanitizer (the SiteImprove filter).
//
// Enhancements beyond what Apollo was configured to do here:
//   - 8s timeout via AbortController (Apollo had no timeout)
//   - Single retry on transient network errors (Apollo's retry-link
//     wasn't wired)
//   - In-flight deduplication: identical simultaneous queries share
//     a single promise (matches Apollo's built-in behavior)
//   - Rich errors with .graphQLErrors array and .networkError flag
//   - Optional telemetry: errors dispatch a 'gql-error' CustomEvent
//     on window so future observability can listen in without code
//     changes here.
//
// What was NOT replicated:
//   - Normalized cross-query cache (Apollo's __typename/id
//     normalization). Zero mutations exist in this codebase so nothing
//     consumes this feature.
//   - Subscriptions / websockets. Never used here (wsEndpoint was null
//     in the old vue-apollo config).

import appConfig from "../config/config.json";
import { sanitizeText } from "./contentSanitizer";

const ENDPOINT = appConfig.api.baseGraphQL || "http://localhost:1337/graphql";
const TIMEOUT_MS = 8000;
const RETRY_DELAY_MS = 500;

// Template tag. Returns the raw GraphQL string — no AST parsing on the
// client. Source-side syntax (gql`query {...}`) is unchanged from
// graphql-tag, so the ESLint graphql plugin continues to validate
// query strings against schema.json at lint time.
export function gql(strings, ...values) {
  let out = "";
  for (let i = 0; i < strings.length; i++) {
    out += strings[i];
    if (i < values.length) out += values[i];
  }
  return out;
}

// Recursively sanitize every string in a response body. Moved verbatim
// from src/vue-apollo.js — this was the sanitizeLink afterware. Exported
// so non-GraphQL fetchers (the publications REST pager) can run their
// payloads through the same SiteImprove filter.
export function deepSanitize(obj) {
  if (typeof obj === "string") return sanitizeText(obj);
  if (Array.isArray(obj)) return obj.map(deepSanitize);
  if (obj && typeof obj === "object") {
    const out = {};
    for (const key of Object.keys(obj)) out[key] = deepSanitize(obj[key]);
    return out;
  }
  return obj;
}

const responseCache = new Map();
const inFlight = new Map();

function buildCacheKey(query, variables) {
  return query + "|" + JSON.stringify(variables || {});
}

function makeError(message, extras) {
  const err = new Error(message);
  if (extras) Object.assign(err, extras);
  return err;
}

function emitTelemetry(err) {
  if (typeof window === "undefined") return;
  if (typeof CustomEvent !== "function") return;
  window.dispatchEvent(new CustomEvent("gql-error", { detail: err }));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(query, variables, endpoint) {
  const controller =
    typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller
    ? setTimeout(() => controller.abort(), TIMEOUT_MS)
    : null;
  try {
    return await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      signal: controller ? controller.signal : undefined,
    });
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function runOnce(query, variables, endpoint) {
  let res;
  try {
    res = await fetchWithTimeout(query, variables, endpoint);
  } catch (e) {
    const isTimeout = e && e.name === "AbortError";
    throw makeError(
      isTimeout
        ? "GraphQL request timed out after " + TIMEOUT_MS + "ms"
        : (e && e.message) || "Network error",
      { networkError: true, timeout: isTimeout }
    );
  }
  if (!res.ok) {
    // Deterministic server-side failure — retry won't help.
    throw makeError("GraphQL HTTP " + res.status, {
      networkError: true,
      status: res.status,
    });
  }
  const body = await res.json();
  if (body.errors && body.errors.length) {
    // Apollo's behavior: if data is present alongside errors, the
    // result() handler still fires. Preserve that here.
    if (body.data) {
      return {
        data: deepSanitize(body.data),
        graphQLErrors: body.errors,
      };
    }
    throw makeError(body.errors[0].message, { graphQLErrors: body.errors });
  }
  return { data: deepSanitize(body.data) };
}

export async function runQuery(query, variables, fetchPolicy, endpoint) {
  // Per-query endpoint override for the researchhub GraphQL server
  // (3 files, 4 queries use this). Matches vue-apollo's `context.uri`
  // per-query override. Defaults to the main agency endpoint.
  const target = endpoint || ENDPOINT;
  // Cache key includes endpoint so same query against different servers
  // doesn't collide.
  const key = target + "|" + buildCacheKey(query, variables);
  const useCache = fetchPolicy !== "no-cache";

  if (useCache && responseCache.has(key)) {
    return responseCache.get(key);
  }
  if (inFlight.has(key)) {
    return inFlight.get(key);
  }

  const promise = (async () => {
    try {
      return await runOnce(query, variables, target);
    } catch (err) {
      // Retry once on transient network errors (no HTTP status = could
      // not reach server). Do NOT retry HTTP 4xx/5xx (deterministic)
      // or GraphQL errors (server computed them, won't change).
      if (err.networkError && !err.status) {
        await sleep(RETRY_DELAY_MS);
        try {
          return await runOnce(query, variables, target);
        } catch (retryErr) {
          emitTelemetry(retryErr);
          throw retryErr;
        }
      }
      emitTelemetry(err);
      throw err;
    }
  })();

  inFlight.set(key, promise);
  try {
    const result = await promise;
    if (useCache) responseCache.set(key, result);
    return result;
  } finally {
    inFlight.delete(key);
  }
}
