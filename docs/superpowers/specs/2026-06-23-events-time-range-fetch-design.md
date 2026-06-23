# Events page — bound the fetch with a time-range dropdown

**Date:** 2026-06-23
**Status:** Design approved (brainstorming); pending spec review → implementation plan
**Area:** `/events/` (legacy Vue 2 SPA)

## Problem

`src/views/Events/EventsAll.vue` fetches **all** events/meetings/jobs/grants in one `GET_EVENTS` GraphQL call with **no date bound**, then hides most of them client-side via the "Upcoming and ongoing events only" checkbox.

Measured against the live API (2026-06-23): ~**648 records** are fetched on every page load (291 meetings + 233 jobs + 118 grants + 6 events), expanded to ~**1,276** client-side calendar markers, to display ~**2** by default. The checkbox does **not** reduce the fetch — it only filters rows in JS after they're already downloaded and processed. The download + client processing is the bottleneck, and it is paid on every visit regardless of the checkbox.

## Goal

Bound the fetch **in the query** so the API returns only the slice the user asked for. Replace the binary checkbox with a time-range dropdown that defaults to the smallest (current & ongoing) fetch and lets users opt into bounded windows of history. This also makes the **default** load — the case ~all visitors hit — dramatically faster, not just the "show past events" path.

## Constraints

- **Strapi 3 GraphQL** server (`agency.icjia-api.cloud`, REST + GraphQL). Filter syntax MUST be Strapi 3: `where: { <field>_gte: <value> }` with inline `_gte` operators. **NOT** Strapi 4/5 (`filters: { end: { gte: ... } }`). Do not "modernize" this.
  - Verified live: `eventsConnection(where: { end_gte: "2026-06-23" })` and `meetings(where: { addToEventCalendar: true, end_gte: "2026-06-23" })` filter correctly (counts drop vs unfiltered).
  - In Strapi 3 the `where` argument is a JSON-style filter object — pass each entity's `where` as a GraphQL **`JSON` variable** computed from `since`, rather than embedding a typed scalar inside an inline object literal.
- Stays a **100% client-side SPA** — no SSR, no backend, no Strapi upgrade, no REST migration. The browser still issues the GraphQL call; it just asks for less.
- `GET_EVENTS` already uses Strapi-3 `where` for meetings (`addToEventCalendar: true`), and the fetch shim/`gql-client` already supports query variables (e.g., `$slug`, `$articleLimit`) — so both patterns are established in-repo.

## Design

### UI — `src/components/EventToggle.vue`

- Remove the `Upcoming and ongoing events only` checkbox.
- Add a `v-select` dropdown (default **"Current & ongoing"**):
  | Label | `since` |
  |---|---|
  | Current & ongoing *(default)* | today |
  | Past 3 months | today − 3 mo |
  | Past 6 months | today − 6 mo |
  | Past 9 months | today − 9 mo |
  | Past 12 months | today − 12 mo |
  | Past 18 months | today − 18 mo |
  | Past 24 months | today − 24 mo |
- **Hard cap at 24 months** — no "all" option, so the full ~648-record fetch is never reachable.
- On change, emit the selected **`monthsBack`** integer (`0` = current & ongoing) to the parent — replacing the current `toggleUpcoming` emit; the parent computes `since` from it. Keep the existing List/Calendar toggle untouched (List is the default view as of 1.5.50).
- Accessibility: the select needs a visible/associated label; preserve current keyboard/focus behavior.

### Query — `src/graphql/events.js` (`GET_EVENTS`)

- Parameterize each entity's filter with a `JSON` variable:
  ```graphql
  query Events($eventsWhere: JSON, $meetingsWhere: JSON, $jobsWhere: JSON, $grantsWhere: JSON) {
    events(sort: "start:asc", where: $eventsWhere) { … }
    meetings(sort: "start:asc", where: $meetingsWhere) { … }
    jobs(sort: "start:asc", where: $jobsWhere) { … }
    grants(sort: "start:asc", where: $grantsWhere) { … }
  }
  ```
- Keep all existing selected fields and sorts.

### Fetch / state — `src/views/Events/EventsAll.vue`

- Track the selected range in component data (e.g., `monthsBack: 0` for current & ongoing).
- Compute `since` = `0 → today` else `dayjs().subtract(monthsBack, "month")`, formatted as the API expects (date-only `YYYY-MM-DD` works for `_gte`).
- Provide the four `where` objects via the apollo `variables()`:
  ```js
  const since = /* computed */;
  return {
    eventsWhere:   { end_gte: since },
    meetingsWhere: { addToEventCalendar: true, end_gte: since },
    jobsWhere:     { end_gte: since },
    grantsWhere:   { end_gte: since },
  };
  ```
- On dropdown change → update `monthsBack` → Apollo re-runs `GET_EVENTS` with the new bound (`fetchPolicy: "no-cache"` stays) → browser fetches the bounded slice. Surface the existing loading state during the brief re-fetch.
- The existing `result()` mapping (tz conversion, OPEN/DEADLINE marker derivation, colors, `fullPath`, `hideFrom*`) runs unchanged on the smaller set.
- `filterDisplay()`: **remove** the `upcomingOnly` date-filter branch (the date bound now lives in the query). Keep only the `hideFromList` / `hideFromCalendar` split. Both List and Calendar views consume the same fetched set.

### Semantics — one knob: `end_gte: since`

- **Current & ongoing** = `end_gte today` → not-yet-ended = ongoing + upcoming (matches today's default checked-checkbox behavior, just faster).
- **Past N months** = `end_gte (today − N months)` → ended within the last N months + ongoing + upcoming. Current/ongoing is **always** included, per requirement.

### Measured payload per option

~2 (current) · ~54 (6 mo) · ~109 (12 mo) · ~161 (18 mo) · ~200 (24 mo, est. — 6/12/18 measured) — vs ~**648 today on every load**.

## Edge cases

- **Null `end`**: excluded by `end_gte`. The existing `upcomingOnly` filter already keys off `end`, so `end` is expected to be present on calendar-relevant records; acceptable. Revisit only if a needed record lacks `end`.
- **Default parity**: "Current & ongoing" must show the same item set as today's checked checkbox — verify explicitly.
- **Timezone**: `since` computed via dayjs in the app timezone; date-only `_gte` bounds avoid intraday tz edge cases.

## Out of scope

- How the calendar plots NOFOs (OPEN/DEADLINE point markers) — unchanged; user already decided "leave as-is" (see `project_events_calendar_nofo_markers`).
- Caching fetched ranges (re-fetch per selection; bounded and fast). Could add later (narrower ⊂ wider) if usage warrants.
- Any SSR/backend/Strapi-version change.

## Verification

- Each dropdown option fetches the expected bounded count (cross-check vs `*Connection` aggregate counts) and renders in **both** views.
- "Current & ongoing" returns the same items as today's checked checkbox (parity).
- Network panel shows the `where: { end_gte: … }` bound and a payload far smaller than the full fetch; no console errors.
- List stays the default view; Calendar toggle still works.
