# Publications Export — Design Spec

- **Date:** 2026-05-29
- **Status:** Approved (design); pending implementation plan
- **Author:** cschweda (with Claude Code)
- **Topic:** A regenerable script that exports every ICJIA publication to a spreadsheet (.xlsx + .csv) for accessibility analysis by a manager.

## 1. Goal

Produce a spreadsheet listing **all** publications with, at minimum, each publication's **title**, the **absolute URL of its hosted file** (the PDF/document), and the **absolute URL of its dynamically generated detail page**. The output must be **clickable** (a manager opens the sheet and clicks straight through to the file or page) and **regenerable on demand** (content changes weekly).

The downstream purpose is accessibility triage of the documents and pages; the export itself does not analyze accessibility.

## 2. Verified facts (live API + codebase, 2026-05-29)

| Fact | Value | Evidence |
|---|---|---|
| Total publications | **1,108** | `GET https://agency.icjia-api.cloud/publications/count` → `1108` |
| `fileURL` format | **Already absolute**, on two hosts (`agency.icjia-api.cloud` and `researchhub.icjia-api.cloud`), sometimes URL-encoded (`%20`) | live sample of 3 records |
| Detail page URL | **Not stored** — built as `https://icjia.illinois.gov/about/publications/{slug}/` | `generators/generateIndexPublications.js:37`, `src/router/about/index.js:42-68`, `src/config/config.json:8` (`baseClient`) |
| Page-URL prefix | `/about/publications/` is **hardcoded** (not category-driven) | `src/router/about/index.js` |
| `fileURL` case-fixes required | `/Compiler/`→`/compiler/`, `/OGA/`→`/oga/`, `/researchreports/`→`/ResearchReports/` | `src/views/About/PublicationsSingle.vue:90-103` |
| API base | `https://agency.icjia-api.cloud` | `src/config/config.json:6` |
| Client base | `https://icjia.illinois.gov` | `src/config/config.json:8` |
| Available top-level fields | `id, title, slug, summary, fileURL, articleURL, publicationDate, pubType, verified, applicationURL, datasetURL, tags, searchMeta, published_at, created_at, updated_at, translations` | live record |
| One file per publication | `fileURL` is a single string; `translations` (multi-file) exists but is unused | `src/graphql/publications.js`, schema |
| Existing pagination precedent | REST `/publications?_limit=500&_start=N` looped against `/publications/count` | `generators/generateIndexPublications.js:11-27` |
| Retry helper | `generators/apiClient.js` → `createApiClient(baseURL)` with `getWithRetry` (3 retries, 2000ms·attempt backoff) | `generators/apiClient.js` |

## 3. Decisions (from brainstorming)

- **Row model:** one row per publication (each has at most one hosted file).
- **Columns:** the three core fields plus **file type (extension)**, **publication date**, **category/section (`pubType`)**, and **file size**. **Publication Date is the first (leading) column** and the sheet is sorted most-recent-first. A **Web Article URL** column (`articleURL`) sits next to File URL — the researchhub article that corresponds to the PDF, giving authors context on the PDF's relevance. The `datasetURL`, `applicationURL`, and `slug` fields are still fetched and kept on each row object but are **not emitted as columns** for now (they can be re-added later by listing them in the `COLUMNS` array).
- **Missing files:** include & flag — publications with no hosted file stay in the sheet with a blank File URL and `Has hosted file = no`; any external links they have show in their columns.
- **URLs:** all absolute and clickable. File URLs are already absolute; page URLs are prefixed to absolute. Both are rendered as real hyperlinks in the `.xlsx`.
- **Data source:** REST collection endpoint with `_limit`/`_start` paging (proven in this repo; sidesteps the GraphQL ~950-row error the user hit). GraphQL in 2 passes is an equivalent alternative but not used.
- **Output:** `.xlsx` primary + `.csv` companion, written to `scripts/output/` which is gitignored.

## 4. Output

- Path: `scripts/output/publications-YYYY-MM-DD.xlsx` and `scripts/output/publications-YYYY-MM-DD.csv`.
- **Single report set only:** each run first deletes any previous `publications-*.{xlsx,csv}` in the output directory, then writes the current dated pair. There is **no** `publications-latest.*` copy — the date in the filename is the freshness signal. The output directory therefore always holds exactly one report set (xlsx + csv).
- `scripts/output/` added to `.gitignore`.
- `.xlsx` formatting: bold + frozen header row, autofilter on, sensible column widths, Page URL and File URL cells rendered as clickable hyperlinks, File Size (bytes) as a numeric (sortable) column.

### Column specification (in order)

Rows are sorted by **Publication Date descending (most recent first)**, and **Publication Date is the leading column**.

| # | Header | Source / derivation | Notes |
|---|---|---|---|
| 1 | Publication Date | `publicationDate`, fallback `published_at` | normalized `YYYY-MM-DD`; **leading column**; sheet sorted by this, most recent first |
| 2 | Title | `title` | |
| 3 | Type | `pubType` | the "category/section" |
| 4 | Page URL | `https://icjia.illinois.gov/about/publications/{slug}/` | absolute, hyperlinked — the dynamically generated detail page |
| 5 | File URL | `fileURL` after case-fix/normalize | absolute, hyperlinked; blank if none — the hosted PDF/document |
| 6 | Web Article URL | `articleURL` | absolute, hyperlinked; blank if none — the researchhub web article that corresponds to the PDF; gives authors context on whether the PDF is still relevant |
| 7 | File Type | extension parsed from File URL | uppercased: `PDF`, `DOCX`, … ; blank if none |
| 8 | File Size | from HEAD `Content-Length` | human-readable, e.g. `2.4 MB`; blank if unknown |
| 9 | File Size (bytes) | from HEAD `Content-Length` | integer; sortable; blank if unknown |
| 10 | File Status | HEAD HTTP status | `200` / `404` / `error`; blank if no file |
| 11 | Has Hosted File | derived | `yes` / `no` |

> **Not emitted (kept on the row object for easy re-add):** `datasetURL`, `applicationURL`, `slug`. These were removed from the column set on 2026-05-29 as unnecessary for now; re-add by listing them in `COLUMNS`.

## 5. Data flow

1. **Count** — `GET /publications/count` → total (expected ~1,108).
2. **Fetch all** — loop `GET /publications?_limit=500&_start=N&_sort=published_at:desc` until all records retrieved; concat; `uniqBy(id)`.
3. **Transform** each record to a row:
   - **Page URL** = `${baseClient}/about/publications/${slug}/`.
   - **File URL** = normalize(`fileURL`) — see §6.
   - **File Type** = extension parsed from the normalized File URL (strip query/hash, take after last `.`, uppercase).
   - **Has Hosted File** = `yes` if File URL non-empty else `no`.
   - **Publication Date** = `publicationDate || published_at`, formatted `YYYY-MM-DD`.
   - Pass through `pubType`, `articleURL`, `datasetURL`, `applicationURL`, `slug`, `title`.
4. **Enrich** (HEAD pass) — for rows with a File URL, issue a HEAD request (see §7) to fill File Size, File Size (bytes), File Status.
5. **Sort** rows by Publication Date **descending (most recent first)** — matches site ordering; Publication Date is the leading column.
6. **Clear** any previous `publications-*.{xlsx,csv}` from the output directory (done only after the data is in hand, so a failed fetch never wipes a good prior report), then **write** the current dated `.xlsx` and `.csv`.
7. **Summary** to stdout: total, with-file, without-file, dead links (status ≥ 400 or `error`), distinct file types.

## 6. URL handling rules

**Page URL** — always `${baseClient}/about/publications/${slug}/` with trailing slash (canonical per `generateIndexPublications.js`). Page URLs are **not** HTTP-validated: the site is an SPA, so any path returns HTTP 200 regardless of slug validity; correctness is guaranteed by construction from the record's own slug.

**File URL normalize(fileURL):**
1. If empty/null → return empty string.
2. Apply case-fixes: `/Compiler/`→`/compiler/`, `/OGA/`→`/oga/`, `/researchreports/`→`/ResearchReports/`.
3. If it already starts with `http` → use as-is (the normal case).
4. Defensive fallback: if it starts with `/` → prefix `${api.base}` (`https://agency.icjia-api.cloud`).
5. Leave existing URL-encoding (`%20`, etc.) untouched.

## 7. File metadata enrichment (HEAD pass)

- Only for rows with a non-empty File URL.
- **Request:** HTTP HEAD, follow redirects, timeout ~15s, capture status code and `Content-Length`.
- **Concurrency:** limited pool (~15 in flight) to avoid hammering the upload hosts.
- **Retry:** up to 2 retries on network error / 5xx (reuse the `apiClient` backoff style); do **not** retry a clean 404.
- **Missing `Content-Length`:** record size as blank/unknown (do not fall back to a full GET in v1).
- **Failure:** record File Status as the HTTP code or `error`; never abort the run.
- This pass doubles as link-health detection (dead file links surface as 404/error) and large-file detection (oversized scanned PDFs).

## 8. Error handling / resilience

- REST fetch uses retry (`getWithRetry`); a persistent fetch failure aborts with a clear message (we cannot produce a partial-but-mislabeled "complete" export).
- HEAD failures are per-row and non-fatal (recorded in File Status).
- The script prints a final summary so the operator can see counts and any anomalies at a glance.

## 9. Dependencies & placement

- **New devDependency:** `exceljs` (writes `.xlsx`; also used for `.csv`).
- **Reused:** `axios` (already a dependency) via `generators/apiClient.js` `createApiClient` for the REST fetch + retry; `lodash` for `uniqBy`/`orderBy` (already a dependency).
- **Script:** `scripts/export-publications.js` (alongside the existing `scripts/` audit/reporting tools).
- **npm script:** `"export:publications": "node scripts/export-publications.js"`.
- **Pure helpers** extracted to a testable module (e.g. `scripts/lib/publications-export-helpers.js`): `buildPageUrl`, `normalizeFileUrl`, `parseFileType`, `formatBytes`, `csvEscape`.

## 10. Testing

- Unit tests (existing mocha + chai setup, `tests/unit/`) cover the pure helpers:
  - `buildPageUrl(slug)` → correct absolute page URL with trailing slash.
  - `normalizeFileUrl(fileURL)` → applies all three case-fixes, passes through absolute URLs, prefixes relative ones, handles null/empty.
  - `parseFileType(url)` → correct uppercase extension; blank for no extension / empty.
  - `formatBytes(n)` → human-readable sizes; blank for null.
  - `csvEscape(value)` → correct quoting/escaping of commas, quotes, newlines.
- The network paths (REST paging, HEAD enrichment, file writing) are verified by a real run producing a valid 1,108-row spreadsheet.

## 11. Known issues & out of scope

- **Live list caps at 990:** `src/graphql/publications.js` `GET_ALL_PUBLICATIONS_QUERY` uses `limit: 990`, so the site's "All Publications" page currently lists only the 990 most recent of 1,108 (the ~118 oldest are reachable by direct URL but not listed). This export includes all 1,108. **Fixing the live cap is out of scope** for this task — flagged for follow-up.
- **Multi-file (`translations`):** the schema supports multiple uploads per publication but it is unused; the export treats `fileURL` as the single file. If multi-file is adopted later, switch to one row per file.
- **No SPA page validation:** page URLs are not HTTP-checked (see §6).
- **No PDF-internal accessibility analysis:** that is the manager's downstream work; this script only enumerates and link-checks.

## 12. Possible future enhancements

- Optional columns: `summary`, `tags`, `verified`.
- Optional ranged-GET fallback when HEAD omits `Content-Length`.
- A `--no-head` flag for a fast metadata-only run.
- Scheduled regeneration (cron) if the manager wants a standing weekly report.
