# Events Time-Range Fetch — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the events page's "Upcoming and ongoing only" checkbox with a time-range dropdown that bounds the GraphQL fetch by date, so the API returns only the requested slice instead of all ~648 records on every load.

**Architecture:** A pure helper computes a per-entity Strapi-3 `where` filter (`end_gte: since`) from a `monthsBack` integer. `EventToggle` exposes a `v-select` that emits `monthsBack`. `EventsAll` feeds the helper's output into the `GET_EVENTS` Apollo variables and re-fetches on change; its client-side date filter is removed because the bound now lives in the query. Stays a 100% client-side SPA.

**Tech Stack:** Vue 2.6, Vuetify 2.5, custom Apollo fetch-shim + `gql` tag, dayjs (`@/plugins/dayjs`), Mocha + Chai + `@vue/test-utils` (run via `npm run tests`).

## Global Constraints

- **Strapi 3 GraphQL only** — filter syntax is `where: { <field>_gte: <value> }` with inline `_gte` operators, passed as `JSON` `where` variables. NOT Strapi 4/5 (`filters: { field: { gte } }`). Verified live.
- **Client-side SPA** — no SSR, no backend, no Strapi-version change. Only the query the browser sends changes.
- **Ranges:** Current & ongoing (default, `monthsBack=0`) + Past 6 / 12 / 18 / 24 months. Hard-capped at 24; no "all" option.
- **Semantics:** one knob, `end_gte: since`. `monthsBack=0` → today; else today − N months. Current/ongoing is always included.
- **Default view is List** (set in 1.5.50) — do not change.
- **Commit convention:** end commit messages with the descriptive content; NO `Co-Authored-By` trailer. Stage everything (`git add -A`).
- **Unit test command:** `NODE_OPTIONS=--openssl-legacy-provider npm run tests` (Mocha). Single file: append the path, e.g. `... npx vue-cli-service test:unit tests/unit/eventsRange.spec.js --require ./tests/unit/setup.js`.

---

### Task 1: Pure range helper + unit tests

**Files:**
- Create: `src/utils/eventsRange.js`
- Test: `tests/unit/eventsRange.spec.js`

**Interfaces:**
- Produces:
  - `EVENT_RANGE_OPTIONS: Array<{ label: string, monthsBack: number }>` — the dropdown items, in order `[0, 6, 12, 18, 24]`.
  - `sinceDate(monthsBack: number, now?: string|Date): string` — `"YYYY-MM-DD"` lower bound; `monthsBack=0` → the reference day, else day − N months.
  - `buildEventWheres(monthsBack: number, now?: string|Date): { eventsWhere, meetingsWhere, jobsWhere, grantsWhere }` — Strapi-3 `where` objects, each `{ end_gte: <sinceDate> }`; `meetingsWhere` also keeps `{ addToEventCalendar: true }`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/eventsRange.spec.js`:

```js
// Unit tests for the events time-range fetch helper (src/utils/eventsRange.js).
import { expect } from "chai";
import {
  EVENT_RANGE_OPTIONS,
  sinceDate,
  buildEventWheres,
} from "@/utils/eventsRange";

describe("eventsRange", () => {
  it("offers Current + 6/12/18/24 months, capped at 24", () => {
    expect(EVENT_RANGE_OPTIONS.map((o) => o.monthsBack)).to.deep.equal([
      0, 6, 12, 18, 24,
    ]);
    expect(EVENT_RANGE_OPTIONS[0].label).to.match(/current/i);
  });

  it("sinceDate(0) is the reference day (current & ongoing)", () => {
    expect(sinceDate(0, "2026-06-23")).to.equal("2026-06-23");
  });

  it("sinceDate(N) is N months earlier", () => {
    expect(sinceDate(6, "2026-06-23")).to.equal("2025-12-23");
    expect(sinceDate(24, "2026-06-23")).to.equal("2024-06-23");
  });

  it("buildEventWheres sets end_gte on events/jobs/grants", () => {
    const w = buildEventWheres(6, "2026-06-23");
    expect(w.eventsWhere).to.deep.equal({ end_gte: "2025-12-23" });
    expect(w.jobsWhere).to.deep.equal({ end_gte: "2025-12-23" });
    expect(w.grantsWhere).to.deep.equal({ end_gte: "2025-12-23" });
  });

  it("meetingsWhere keeps addToEventCalendar AND adds end_gte", () => {
    const w = buildEventWheres(0, "2026-06-23");
    expect(w.meetingsWhere).to.deep.equal({
      addToEventCalendar: true,
      end_gte: "2026-06-23",
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `NODE_OPTIONS=--openssl-legacy-provider npx vue-cli-service test:unit tests/unit/eventsRange.spec.js --require ./tests/unit/setup.js`
Expected: FAIL to compile — `Module not found: '@/utils/eventsRange'`.

- [ ] **Step 3: Write the helper**

Create `src/utils/eventsRange.js`:

```js
// Time-range options + Strapi-3 `where` builders for the events page fetch.
//
// The events page used to fetch ALL events/meetings/jobs/grants (no date bound)
// and hide most of them client-side. This bounds the fetch IN THE QUERY: a
// `monthsBack` integer maps to a lower date bound (`end_gte`) so the API returns
// only the requested slice. monthsBack = 0 => current & ongoing only.
import dayjs from "@/plugins/dayjs";

const EVENT_RANGE_OPTIONS = [
  { label: "Current & ongoing", monthsBack: 0 },
  { label: "Past 6 months", monthsBack: 6 },
  { label: "Past 12 months", monthsBack: 12 },
  { label: "Past 18 months", monthsBack: 18 },
  { label: "Past 24 months", monthsBack: 24 },
];

// Lower bound (YYYY-MM-DD) for `end_gte`. monthsBack 0 => today; else today - N.
function sinceDate(monthsBack, now) {
  const base = now ? dayjs(now) : dayjs();
  const d = monthsBack > 0 ? base.subtract(monthsBack, "month") : base;
  return d.format("YYYY-MM-DD");
}

// Per-entity Strapi-3 `where` filters for GET_EVENTS.
function buildEventWheres(monthsBack, now) {
  const since = sinceDate(monthsBack, now);
  return {
    eventsWhere: { end_gte: since },
    meetingsWhere: { addToEventCalendar: true, end_gte: since },
    jobsWhere: { end_gte: since },
    grantsWhere: { end_gte: since },
  };
}

export { EVENT_RANGE_OPTIONS, sinceDate, buildEventWheres };
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `NODE_OPTIONS=--openssl-legacy-provider npx vue-cli-service test:unit tests/unit/eventsRange.spec.js --require ./tests/unit/setup.js`
Expected: PASS (5 passing).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(events): add time-range fetch helper (monthsBack -> Strapi-3 where)"
```

---

### Task 2: EventToggle — replace checkbox with a range dropdown

**Files:**
- Modify: `src/components/EventToggle.vue`
- Test: `tests/unit/components.spec.js` (append a describe block)

**Interfaces:**
- Consumes: `EVENT_RANGE_OPTIONS` from Task 1.
- Produces: emits `toggleRange(monthsBack: number)` — on mount (initial `0`) and on every dropdown change. Still emits `toggleEventView(icon)`. No longer emits `toggleUpcoming`.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/components.spec.js` (it already imports `shallowMount`, `createLocalVue`, `Vuetify`, `expect`, and sets up `vuetify` in `beforeEach`):

```js
import EventToggle from "@/components/EventToggle.vue";

describe("EventToggle component", () => {
  it("emits toggleRange(0) on mount (current & ongoing default)", () => {
    const wrapper = shallowMount(EventToggle, { localVue, vuetify });
    expect(wrapper.emitted("toggleRange")[0]).to.deep.equal([0]);
  });

  it("emits toggleRange with the selected monthsBack on change", async () => {
    const wrapper = shallowMount(EventToggle, { localVue, vuetify });
    wrapper.vm.monthsBack = 12;
    await wrapper.vm.$nextTick();
    const emits = wrapper.emitted("toggleRange");
    expect(emits[emits.length - 1]).to.deep.equal([12]);
  });

  it("offers five range options (current + 6/12/18/24)", () => {
    const wrapper = shallowMount(EventToggle, { localVue, vuetify });
    expect(wrapper.vm.rangeItems.map((o) => o.monthsBack)).to.deep.equal([
      0, 6, 12, 18, 24,
    ]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `NODE_OPTIONS=--openssl-legacy-provider npx vue-cli-service test:unit tests/unit/components.spec.js --require ./tests/unit/setup.js`
Expected: FAIL — `monthsBack`/`rangeItems` undefined and no `toggleRange` emitted (the component still has the checkbox).

- [ ] **Step 3: Edit the component**

In `src/components/EventToggle.vue`, replace the checkbox `<div class="mt-5">…</div>` block (the `showHideUpcoming` input + label) with a `v-select`:

```html
      <div class="mt-5">
        <v-select
          v-model="monthsBack"
          :items="rangeItems"
          item-text="label"
          item-value="monthsBack"
          dense
          outlined
          hide-details
          label="Show events from"
          aria-label="Show events from time range"
          style="max-width: 260px; margin: 0 auto"
        ></v-select>
      </div>
```

Then replace the `<script>` block's data/mounted/watch with:

```js
<script>
import { EVENT_RANGE_OPTIONS } from "@/utils/eventsRange";
export default {
  data() {
    return {
      icon: "list",
      monthsBack: 0,
      rangeItems: EVENT_RANGE_OPTIONS,
    };
  },
  props: {
    listViewOnly: {
      type: Boolean,
      default: false,
    },
  },
  mounted() {
    this.$emit("toggleEventView", this.icon);
    this.$emit("toggleRange", this.monthsBack);
  },
  watch: {
    icon(newValue, oldValue) {
      this.$emit("toggleEventView", newValue || oldValue);
    },
    monthsBack(newValue) {
      this.$emit("toggleRange", newValue);
    },
  },
};
</script>
```

(Leave the `v-btn-toggle` List/Calendar markup and the `icon: "list"` default unchanged.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `NODE_OPTIONS=--openssl-legacy-provider npx vue-cli-service test:unit tests/unit/components.spec.js --require ./tests/unit/setup.js`
Expected: PASS (existing component tests + 3 new EventToggle tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(events): EventToggle range dropdown replaces upcoming-only checkbox"
```

---

### Task 3: GET_EVENTS — accept per-entity JSON `where` variables

**Files:**
- Modify: `src/graphql/events.js` (the `GET_EVENTS` template)

**Interfaces:**
- Produces: `GET_EVENTS` now declares `($eventsWhere: JSON, $meetingsWhere: JSON, $jobsWhere: JSON, $grantsWhere: JSON)` and applies each as `where:` on the matching collection. Consumed by Task 4's `variables()`.

- [ ] **Step 1: Edit the query**

In `src/graphql/events.js`, change the `GET_EVENTS` operation signature and the four collection `where` args. Keep ALL existing field selections and `sort` values unchanged. Specifically:

- Operation line: `query Events {` → `query Events($eventsWhere: JSON, $meetingsWhere: JSON, $jobsWhere: JSON, $grantsWhere: JSON) {`
- `events(sort: "start:asc") {` → `events(sort: "start:asc", where: $eventsWhere) {`
- `meetings(sort: "start:asc", where: { addToEventCalendar: true }) {` → `meetings(sort: "start:asc", where: $meetingsWhere) {`
- `jobs(sort: "start:asc") {` → `jobs(sort: "start:asc", where: $jobsWhere) {`
- `grants(sort: "start:asc") {` → `grants(sort: "start:asc", where: $grantsWhere) {`

- [ ] **Step 2: Verify the Strapi-3 server accepts the JSON `where` variables**

Run (mimics what the browser/shim will POST — query + variables):

```bash
curl -s 'https://agency.icjia-api.cloud/graphql' -H 'Content-Type: application/json' \
  --data '{"query":"query Events($eventsWhere: JSON, $meetingsWhere: JSON, $jobsWhere: JSON, $grantsWhere: JSON){ events(where:$eventsWhere){id} meetings(where:$meetingsWhere){id} jobs(where:$jobsWhere){id} grants(where:$grantsWhere){id} }","variables":{"eventsWhere":{"end_gte":"2025-12-23"},"meetingsWhere":{"addToEventCalendar":true,"end_gte":"2025-12-23"},"jobsWhere":{"end_gte":"2025-12-23"},"grantsWhere":{"end_gte":"2025-12-23"}}}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('errors:', d.get('errors')); print({k: len(v) for k,v in d.get('data',{}).items()})"
```

Expected: `errors: None` and bounded counts (e.g., grants ≈ 14, far below the unfiltered ~118). If `errors` is non-null, the variable type is wrong — fall back to `$eventsWhere: JSON!` etc. (non-null) or confirm the scalar name in `schema.json`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(events): parameterize GET_EVENTS with Strapi-3 JSON where filters"
```

---

### Task 4: EventsAll — wire the dropdown to a bounded, re-fetching query

**Files:**
- Modify: `src/views/Events/EventsAll.vue`

**Interfaces:**
- Consumes: `buildEventWheres` (Task 1); `GET_EVENTS` with where vars (Task 3); `toggleRange` emit (Task 2).

- [ ] **Step 1: Import the helper and swap state**

At the top of the `<script>` in `src/views/Events/EventsAll.vue`, add to the existing imports:

```js
import { buildEventWheres } from "@/utils/eventsRange";
```

In `data()`, replace `upcomingOnly: null,` with `monthsBack: 0,`.

- [ ] **Step 2: Feed the bounded `where` vars into the query**

Replace the events query's `variables() {}` with:

```js
      variables() {
        return buildEventWheres(this.monthsBack);
      },
```

In the query `result(ApolloQueryResult)` handler, remove the line `this.upcomingOnly = true;` (the date bound now lives in the query). Leave `this.display = "list";` and the rest unchanged.

- [ ] **Step 3: Replace the toggle handler + template binding**

In `methods`, delete `toggleUpcoming(val) {...}` and add:

```js
    toggleRange(monthsBack) {
      this.monthsBack = monthsBack;
      // Re-run the bounded query for the new window. The reactive variables()
      // above also tracks monthsBack; refetch() makes the re-fetch explicit and
      // deterministic regardless of the fetch-shim's reactivity.
      if (this.$apollo && this.$apollo.queries && this.$apollo.queries.events) {
        this.$apollo.queries.events.refetch();
      }
    },
```

In the template, change the `EventToggle` binding:

```html
            <EventToggle
              @toggleEventView="toggleEventView"
              @toggleRange="toggleRange"
            ></EventToggle>
```

- [ ] **Step 4: Drop the client-side date filter from `filterDisplay()`**

Replace the `upcomingOnly` block at the end of `filterDisplay()` so it returns the hide-filtered items directly (the date bound is server-side now):

```js
      // Date bounding now happens server-side via buildEventWheres(); here we
      // only split list vs calendar visibility.
      return newItems;
```

i.e. remove the entire `let filteredNewItems; if (this.upcomingOnly) { ... } else { return newItems; }` tail, keeping only `return newItems;`.

- [ ] **Step 5: Verify the dev build compiles**

Restart the dev server clean and confirm it compiles with no errors:

```bash
kill-port 8080 >/dev/null 2>&1
NODE_OPTIONS=--openssl-legacy-provider npx vue-cli-service serve
```

Expected: `App running at http://localhost:8080/` with no `Failed to compile`.

- [ ] **Step 6: Verify behavior in the browser (dev)**

Open `http://localhost:8080/events/`. Using DevTools → Network (the GraphQL POST to `agency.icjia-api.cloud`):
- On load (default): request `variables` show `end_gte` = today on all four `where`s; response is small (~a handful of records). The List view shows the current/ongoing items (same as the old checked-checkbox view — parity check).
- Select **"Past 12 months"**: a NEW GraphQL POST fires with `end_gte` ≈ today − 12 months; response grows to ~109 records; List view shows more items.
- Toggle to **Calendar View**: the same fetched set renders; no console errors.
- If selecting a range does NOT fire a new request, confirm `this.$apollo.queries.events.refetch()` exists on the shim; if the shim lacks `refetch`, instead re-assign a reactivity key (e.g., bump a `fetchKey` in `variables()`), or read `src/mixins/apollo-shim.js` to use its supported re-run API.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(events): bound the fetch by the range dropdown; drop client-side date filter"
```

---

### Task 5: Changelog, version bump, full-suite check, ship

**Files:**
- Modify: `CHANGELOG.md`, `package.json`

- [ ] **Step 1: Run the full unit suite (no new breakage)**

Run: `NODE_OPTIONS=--openssl-legacy-provider npm run tests`
Expected: the new `eventsRange` (5) + `EventToggle` (3) tests pass; the pre-existing 10 failures (SkipLink / fixFootnoteTargetSize / fixCmsTables / Markdown) are unchanged — confirm no NEW failures.

- [ ] **Step 2: Add the changelog entry**

In `CHANGELOG.md`, insert above the latest `## [1.5.50]` entry:

```markdown
## [1.5.51] - 2026-06-23

### perf(events) — Bound the events fetch with a time-range dropdown (was a full fetch every load)

`/events/` used to fetch **all** events/meetings/jobs/grants (~648 records → ~1,276 client-side markers) on every load and hide most of them client-side via the "Upcoming and ongoing only" checkbox — the checkbox never reduced the fetch. Replaced it with a time-range dropdown (**Current & ongoing** default, + Past 6 / 12 / 18 / 24 months, hard-capped) that bounds the fetch **in the GraphQL query** (`where: { end_gte: since }`, Strapi-3 syntax, passed as `JSON` `where` variables). The default now fetches only current/ongoing (~a handful of records); history is opt-in and bounded (~54 / 109 / 161 / ~200). Re-fetches on change; stays a client-side SPA. `filterDisplay()`'s client-side date filter was removed (the bound is server-side now); applies to both List and Calendar.

**Files:**

- `src/utils/eventsRange.js` (new) — `EVENT_RANGE_OPTIONS` + `sinceDate()` + `buildEventWheres()`; unit-tested.
- `src/components/EventToggle.vue` — checkbox → `v-select` range dropdown; emits `toggleRange(monthsBack)`.
- `src/graphql/events.js` — `GET_EVENTS` takes per-entity `JSON` `where` variables.
- `src/views/Events/EventsAll.vue` — bounded `variables()`, `toggleRange` re-fetch, removed `upcomingOnly` client filter.
- `tests/unit/eventsRange.spec.js`, `tests/unit/components.spec.js` — coverage.
- `package.json` — version bump to 1.5.51.
```

- [ ] **Step 3: Bump the version**

In `package.json`, change `"version": "1.5.50",` → `"version": "1.5.51",`.

- [ ] **Step 4: Commit and push**

```bash
git add -A
git commit -m "chore(events): changelog + version bump to 1.5.51 for the time-range fetch dropdown"
git push origin main
```

---

## Self-Review notes

- **Spec coverage:** UI dropdown (Task 2), Strapi-3 `where` query (Task 3), bounded re-fetch + `filterDisplay` cleanup + both views (Task 4), 6-month/24-cap ranges (Task 1 options), default parity + payload check (Task 4 Step 6), changelog/version (Task 5). All covered.
- **Re-fetch risk:** Task 4 Step 6 explicitly verifies the dropdown triggers a new network request and documents the fallback if the fetch-shim doesn't honor reactive `variables()` / `refetch()`.
- **Type consistency:** `monthsBack` (number) flows EventToggle → `toggleRange` → `EventsAll.monthsBack` → `buildEventWheres(monthsBack)` → `{eventsWhere,meetingsWhere,jobsWhere,grantsWhere}` → GET_EVENTS `$eventsWhere…`. Consistent across tasks.
- **Out of scope (untouched):** NOFO OPEN/DEADLINE calendar markers, caching, SSR.
