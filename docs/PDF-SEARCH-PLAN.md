# Searching inside PDFs on icjia.illinois.gov — plan

**Status: plan only. Nothing has been built, downloaded or created.** The offline pilot (Phase 1) starts when the site's owner says so; every later phase needs its own go-ahead. Written 19 September 2026.

## Contents

1. The question, and the short answer
2. What was measured
3. Design
4. Phase 1: the pilot (offline)
5. Later phases
6. Decisions to make before anything ships
7. Verification
8. What to reuse
9. Notes from the design review

---

## 1. The question, and the short answer

Can the site's search look inside PDF files? Will Fuse.js do it, or is Pagefind the better option for search overall, PDFs included?

- **It is feasible.** The hard part, getting text out of PDFs at build time and caching it, already exists in ICJIA's own toolkit, [`ICJIA/pdf-search-index`](https://github.com/ICJIA/pdf-search-index) (`@icjia/pdf-search-index`).
- **Fuse.js: no, not for PDF contents.** Fuse (and its multi-worker version, and FlexSearch) must download the whole text into the visitor's browser before searching: about 92 MB for publications alone. Fuzzy matching over body text would also multiply the junk matches the search was tuned to fold away in v1.5.95 ("drone" matching "and One Time"). The limit is the *volume of text*, not the number of documents: the toolkit's README sets its thresholds in documents (Fuse under 2,500), but ICJIA's PDFs average 88 KB of text each.
- **Pagefind: yes for PDF contents**, because it fetches its index in small pieces per search, so the total size does not matter to visitors. **Not as a replacement for the whole search on this site**: it has no tolerance for misspellings ("juvanile", "homocide"), and it would discard the behaviour tuned in September 2026 (pages before posts, similar results folded away, partner sites, keyword maps) on a site due to be replaced.

**Decided:** a hybrid. Keep the tuned Fuse search for the site's records. Add a second, documents-only Pagefind index, searched at the same time and shown as its own group on the results page ("Found inside documents"), with a highlighted excerpt and a link that opens the PDF. Pilot first, offline, on publications from 2000 on. Extracted text lives in a separate data repository kept by a scheduled job. The documents index carries over unchanged to the Astro rebuild, where the engine for the whole site is decided once.

## 2. What was measured

| Fact | Value | Source |
|---|---|---|
| Publication PDFs | **1,068**, **2.19 GB**, mean 2.11 MB, on five hosts (86% on `archive.icjia-api.cloud`) | `public/api/publications.json` (`fileURL`), `scripts/output/publications-2026-05-29.csv` |
| By decade | 1980s 39 · 1990s 166 · 2000s 505 · 2010s 203 · 2020s 155 | `publicationDate` |
| Extracted text per PDF | **mean 88 KB** (111 KB among those with text); 2 KB to 306 KB | 24 PDFs chosen evenly by date, streamed through `pdftotext`, nothing saved |
| Total text, publications only | **about 92 MB**; about 110 MB once the scans are OCR'd | 1,068 × 88 KB |
| No text layer (scans) | **5 of 24 sampled: all 5 of the 5 from before 2000, none of the 19 from 2000 on** → roughly 200 PDFs | same sample |
| Other attachments (meeting agendas and minutes, funding-notice files, news, policies, required forms, Research Hub article files) | not listed in the build's output; only the app's runtime queries select them (`src/graphql/*.js`, `src/views/Hub/ArticlesSingle.vue`) | survey of the generators |
| Netlify build | no plugins, **no cache between builds**, a ceiling of about 25 minutes, 30 or more builds a month (pushes and the nightly rebuild) | `netlify.toml`, `docs/nightly-rebuild.md` |
| Content-Security-Policy | report-only; `script-src` has `'unsafe-eval'`, so WebAssembly loads. Enforced, it would need `'wasm-unsafe-eval'` | `netlify.toml` |
| Current index | 2,450 records, 2.9 MB, Fuse in a worker; searches titles, keywords, tags and the first 60 characters of long text | `public/searchIndex.json`, `src/utils/searchFields.js` |

## 3. Design

- **Extraction** reuses the toolkit's core through its programmatic API: `indexDocuments(entries, { cacheDir, concurrency: 4, maxBytes: 128 MiB, fetchTimeout: 180000 })`. The command line cannot raise `maxBytes`, and the 32 MiB default would silently skip eight PDFs, one of them in the pilot set. The list of files comes from `scripts/lib/publications-export-helpers.js` (`normalizeFileUrl`, `FILE_URL_CASE_FIXES`), limited to known hosts and `.pdf`.
- **Indexing uses Pagefind's Node API, not HTML stub pages:** `index.addCustomRecord({ url: <the PDF's address>, content, language: "en", meta: { title, date }, sort })`, then `writeFiles`. The toolkit's `emitPagefindHTML` followed by the Pagefind command would publish the stub pages at a public address, would also index `dist/index.html` and the page shells, and would index its own "Format" and "Source" lines, so that every document matched "https". This site needs no change to the toolkit.
- **The data repository holds only address → text** (`cache/<hash>.txt` and `.meta.json`, the toolkit's own cache format, plus a sorted `manifest.json`). Titles, dates and *which records exist* come from `public/api/publications.json` when the site is built, so an edit or a removal in the CMS is right at the next build, with nothing to do by hand.
- **Changed files** are found by a nightly HEAD request: signature = `ETag`, or `Last-Modified` with `Content-Length` (the archive host sends strong ETags; the Strapi hosts send the other two). A new address is extracted; a changed signature is extracted again.
- **The site build never fails because of this.** It fetches the data repository as one archive (60-second timeout, three tries). On any failure it logs loudly, writes a status file and exits cleanly: the deploy has no `/pagefind/`, the loader finds nothing, and the search page is exactly today's.
- **Cache headers:** Pagefind's five unhashed files revalidate on every visit (the lesson of v1.5.84). **No `immutable` on the index chunks:** the site's catch-all would answer a missing chunk with `index.html` and status 200, and that would be cached for a year.
- **Misspellings are corrected word by word.** Pagefind drops a word it does not know from a query of several words, so "juvanile detention" would return everything that mentions detention. For each typed word of five or more letters that finds nothing, the nearest word (one letter away) seen in the site's own results is used, reusing `distance` from `src/utils/highlight.js`, and the page says so: *No documents contain “juvanile”. These contain “juvenile”.*
- **Results load five at a time:** each Pagefind result carries its document's whole text.
- **The page change is additive.** A separate component, folded away by default like the similar results and open when nothing on the site contains the words, with its own paging and status message. PDF links open in a new tab and say so. It must not use `data-result-index` or `card-title-link` (Back, "Show more results" and the focus tracking depend on them), and `resultStatus()` with its pinned strings stays as it is.

## 4. Phase 1: the pilot (offline)

In a new folder **outside this repository**, `icjia-pdf-text/` beside it (the future data repository). Nothing is pushed and no GitHub repository is created. Scope: publications dated 2000 on, about 860 records and about 1 GB, downloaded once from ICJIA's own hosts, four at a time, into a local cache.

1. List the files (Strapi REST `/publications`, normalise, filter).
2. Extract with the toolkit; record failures by cause, characters per document, and empty or garbled text.
3. Build the Pagefind index with the Node API: twice (the file names must be identical) and once on a GitHub `ubuntu-latest` runner, standing in for Netlify.
4. Measure the index: size, number of files, largest chunks and results.
5. Measure 30 searches in a real browser (cold first search, first five results, and again throttled to 1.6 Mbps): the 20 most frequent real searches from Plausible, plus 10 probes (words found only inside documents, names, a question full of filler words, a word typed letter by letter), and a separate set of 10 misspellings.
6. Write `pilot/results/RESULTS.md` for grading.

**Stop or redesign if:**

| Measure | Expected | Stop or redesign if |
|---|---|---|
| Extraction failures after one retry (404 and 403 aside) | under 1% | over 3% |
| Empty or garbled text | about none | over 5% |
| Size of `pagefind/` | 35 to 50 MB | over 100 MB |
| Number of files | 1,700 to 2,500 | over 10,000 |
| Fetch and index on the runner | under 60 s | over 150 s (then build the index in the data job) |
| The same input built twice | identical file names | they differ (every deploy would upload everything) |
| Cold first search, before results load | 150 to 400 KB | median over 600 KB |
| First five results | about 150 KB | median over 400 KB (then index page by page, linking to `#page=N`) |
| Searches graded useful | — | fewer than 24 of 30 |
| Misspellings recovered | — | fewer than 7 of 10 (then test a corrector built from the documents' own words) |

## 5. Later phases

Each needs its own go-ahead.

2. **Data repository and nightly job** (`ICJIA/icjia-pdf-text`, public). Runs before the 05:00 UTC rebuild; commits only when something changed; stops without committing if the list of files is under 80% of the last one; text no record points to is removed after 30 days; a heartbeat commit keeps GitHub from disabling the schedule; the toolkit's version is pinned, so an extractor update does not rewrite every file.
3. **Site build.** `generators/generateDocumentSearch.mjs` (an ES module, as `pagefind` is; the version pinned exactly, and the lockfile must include the Linux binary) with pure helpers in `generators/utils/documentRecords.js`; output to `public/pagefind/` (gitignored); `build` runs `(npm run generate:documents || true)` after `npm run scripts`; header rules appended after the existing search rules in `netlify.toml`, which tests pin. One record per PDF: 26 addresses are shared by 60 records, so the newest title wins and the mismatches are listed for editors.
4. **Results page.** `src/services/documentSearch.js` (`import(/* webpackIgnore: true */ "/pagefind/pagefind.js")`; nothing when the index is absent; one retry after a stale chunk), `src/utils/documentQuery.js`, `src/utils/documentExcerpt.js` (DOMPurify, only `<mark>` allowed), `src/components/DocumentResults.vue`, one element and one summary line in `src/views/Search/SearchStatic.vue`, and a switch `search.documents.enabled` in `src/config/config.json` so it can ship dark.
5. **OCR for the 200 or so scans from before 2000** (`ocrmypdf --skip-text`, once). Until then they are found by title only; they are also unreadable by screen readers today.
6. **Other collections:** meeting agendas and minutes, funding-notice files, Research Hub article files. New build-time queries, copying what `src/graphql/*` already selects.

## 6. Decisions to make before anything ships

- **Names inside documents become searchable:** authors, staff lists, minutes. That includes names that `generators/utils/purifyStaffNames.js` deliberately keeps out of search keywords. The pilot's searches for names will show the effect.
- **Taking a document down:** its text stays in the data repository's history until that history is purged.
- Search will send more visitors into old PDFs that are not accessible. OCR helps only in part.

## 7. Verification

- Pilot: `RESULTS.md` against the table above; this repository is untouched.
- Phases 3 and 4: tests first, in this repository's style (`documentQuery`, `documentExcerpt`, `documentSearch`, `documentResults`, `documentRecords`, and a contracts spec: the five revalidating header rules, no `immutable` under `/pagefind/`, the order of `build` and its `|| true`). Every existing mocha test passes unchanged (`npm run tests`); the test that the worker and the app order results identically is not touched.
- axecap with no violations and lightcap accessibility 100, on desktop and at phone width, in five states: group folded, group open, the correction note showing, nothing on the site but documents found, index absent. Keyboard order, reflow at 320 px, forced colours on the highlight.
- Live: bytes for a first search, a Plausible event to size bandwidth per search, and a deploy with the data fetch forced to fail, which must be identical to today's search page.

## 8. What to reuse

`scripts/lib/publications-export-helpers.js` · `scripts/export-publications.js` · `src/services/searchClient.js` and `src/services/AppInit.js` (the loader pattern) · `src/utils/highlight.js` (`distance`) · `src/utils/searchFields.js` (`searchWords`) · the similar-results disclosure in `src/views/Search/SearchStatic.vue` · the core of `@icjia/pdf-search-index` (`indexDocuments`, its file cache).

## 9. Notes from the design review

**Improvements the toolkit could take in a later release** (none is needed here): a `buildPagefindIndex(rows, { outputPath, meta(row), sort(row) })` over `addCustomRecord`; `data-pagefind-ignore` on the "Format" and "Source" lines of `emitPagefindHTML`, with a way to pass metadata and the real address; a `cache: "revalidate"` mode; command-line flags for `maxBytes` and the fetch timeout; keeping page breaks when extracting, so links to `#page=N` stay possible without extracting again; and restating the README's scale guidance in megabytes of text.

**Not verified, to be settled by the pilot:** every size and time estimate; that Pagefind's file names are identical for identical input (its changelog says so); that `webpackIgnore` survives this project's Babel setup; how long GitHub keeps a quiet repository's schedule alive, and the limits on its archive downloads (both from memory); the change-detection headers were sampled at one address per host; whether an exact (quoted) Pagefind search avoids loading chunks for prefixes.
