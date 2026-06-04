/**
 * REST source map for live-island fetchCollection calls.
 * Collection names are Strapi v3 pluralized type names, confirmed from
 * astro/src/graphql/*.js query roots and REST /count probes.
 *
 * Verification status per collection:
 *   posts        — verified 200 OK, Access-Control-Allow-Origin: *
 *   publications — verified (pilot; PublicationTable live-island in production)
 *   meetings     — Strapi v3 convention; name confirmed from meetings.js query root
 *   events       — Strapi v3 convention; name confirmed from events.js query root
 *   grants       — Strapi v3 convention; name confirmed from grants.js query root
 *   programs     — Strapi v3 convention; name confirmed from grants.js query root
 *   articles     — Strapi v3 convention; name confirmed from hub.js query root
 *   datasets     — Strapi v3 convention; name confirmed from hub.js query root
 *   apps         — Strapi v3 convention; name confirmed from hub.js query root
 *
 * Collections marked "convention" must be validated at the deploy gate by
 * checking /<collection>/count → 200 with CORS: Access-Control-Allow-Origin: *.
 */

export const AGENCY = 'https://agency.icjia-api.cloud';
export const HUB = 'https://researchhub.icjia-api.cloud';

export const SOURCES = {
  news:         { host: AGENCY, collection: 'posts' },          // verified 200, ACAO:*
  publications: { host: AGENCY, collection: 'publications' },   // verified (pilot)
  meetings:     { host: AGENCY, collection: 'meetings' },       // convention (confirm at deploy gate)
  events:       { host: AGENCY, collection: 'events' },         // convention (confirm at deploy gate)
  funding:      { host: AGENCY, collection: 'grants' },         // convention (confirm at deploy gate)
  programs:     { host: AGENCY, collection: 'programs' },       // convention (confirm at deploy gate)
  // researchhub gates on a CUSTOM `status` field (NOT Strapi's built-in publish
  // state), so the live REST read MUST carry status=published or it returns the
  // 30 datasets / 9 apps that are draft on the live site — which neither the baked
  // baseline nor prod show. Verified: /datasets/count?status=published → 5,
  // /apps/count?status=published → 5, ACAO:* from a preview origin (browser-safe).
  hubArticles:  { host: HUB,    collection: 'articles', query: 'status=published' }, // convention (confirm at deploy gate)
  hubDatasets:  { host: HUB,    collection: 'datasets', query: 'status=published' }, // verified 200, ACAO:*
  hubApps:      { host: HUB,    collection: 'apps',     query: 'status=published' }, // verified 200, ACAO:*
} as const;

export type SourceKey = keyof typeof SOURCES;
