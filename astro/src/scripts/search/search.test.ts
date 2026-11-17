// The search's parity with the live site (v1.5.146): the index extras ported
// from generators/, the closing-day rule without dayjs, and the downloads.
import { describe, it, expect } from 'vitest';
// @ts-expect-error — plain .mjs build script
import { addKeywords, withoutRetired, labelsByPage, MANUAL_PAGES, partnerRecords, KEYWORDS } from '../../../scripts/search-index-extras.mjs';
import menus from '../../config/menus.json';
import { isPastLastDay, isMeetingOver } from './ended.js';
import { toCsv, toJson, exportFileName, downloadEvent, COLUMNS } from './searchExport.js';

describe('search index extras (generators/ parity)', () => {
  it('adds the page keywords, once', () => {
    const [page] = addKeywords([{ fullPath: '/grants/funding/', searchMeta: 'funding' }]);
    expect(page.searchMeta).toBe(`funding ${KEYWORDS['/grants/funding/']}`);
    const [again] = addKeywords([page]);
    expect(again.searchMeta).toBe(page.searchMeta);
  });

  it("adds a list page's link names from its collections", () => {
    const labels = labelsByPage({ requiredForms: [{ title: 'Time  Certification' }, { title: 'GATA' }] });
    expect(labels['/grants/required-forms/']).toBe('Time Certification GATA');
    const [page] = addKeywords([{ fullPath: '/grants/required-forms/', searchMeta: 'forms' }], labels);
    expect(page.searchMeta).toBe('forms Time Certification GATA');
  });

  it('leaves out the retired About page', () => {
    expect(withoutRetired([{ fullPath: '/about/policies/' }, { fullPath: '/x/' }])).toEqual([{ fullPath: '/x/' }]);
  });

  it('has the hand-built pages, without their head tags', () => {
    expect(MANUAL_PAGES.map((p: { fullPath: string }) => p.fullPath)).toContain('/news/press/');
    expect(MANUAL_PAGES.every((p: object) => !('shell' in p))).toBe(true);
  });

  it("builds the Partners menu's records, with no Illinois Heals (removed v1.5.93)", () => {
    const records = partnerRecords(menus);
    expect(records.length).toBe(10);
    expect(records.find((r: { altTitle: string }) => r.altTitle === 'R3').tags).toContain('website');
    expect(records.filter((r: { contentType: string }) => r.contentType === 'plan').length).toBe(4);
    expect(records.some((r: { fullPath: string }) => r.fullPath.includes('ilheals'))).toBe(false);
  });
});

describe('closing day (src/utils/ended.js parity)', () => {
  it('is open through the last day, to midnight in Chicago', () => {
    expect(isPastLastDay('2026-09-25', new Date('2026-09-26T04:59:00Z'))).toBe(false);
    expect(isPastLastDay('2026-09-25', new Date('2026-09-26T05:00:00Z'))).toBe(true);
    expect(isPastLastDay(null)).toBe(false);
  });
  it('ends a meeting at the later of its start and end', () => {
    const meeting = { start: '2026-09-08T18:00:00Z', end: null };
    expect(isMeetingOver(meeting, new Date('2026-09-08T17:00:00Z'))).toBe(false);
    expect(isMeetingOver(meeting, new Date('2026-09-08T19:00:00Z'))).toBe(true);
  });
});

describe('downloads (src/utils/searchExport.js parity)', () => {
  const NOW = new Date('2026-11-17T18:00:00Z');
  const results = [
    { item: { title: '=SUM(1)', contentType: 'news', category: 'pressRelease', fullPath: '/news/x/', tags: ['A'] } },
    { similar: true, item: { title: 'Job', contentType: 'employment', fullPath: '/about/employment/j/', end: '2026-09-25' } },
  ];
  it('writes CSV with a BOM, no formulas, the 22 columns', () => {
    const csv = toCsv(results, NOW, 'press');
    expect(csv.startsWith('﻿Rank,Query,Title')).toBe(true);
    expect(csv).toContain("'=SUM(1)");
    expect(COLUMNS.length).toBe(22);
  });
  it('writes JSON with the search and the results', () => {
    const data = JSON.parse(toJson(results, [['Search', 'x']], NOW, 'x'));
    expect(data.search).toEqual({ search: 'x' });
    expect(data.results[0].category).toBe('Press Release');
    expect(data.results[1].status).toBe('Closed');
    expect(data.results[0].query).toBe('x');
    expect(data.results[1].query).toBe('x (similar spelling or partial match)');
  });
  it('names the file and the Plausible event as the live site does', () => {
    expect(exportFileName('Use of force', 'hub', 'csv', NOW)).toBe('icjia-search-use-of-force-hub-2026-11-17.csv');
    expect(downloadEvent('json', ' Prison ', null, 3)).toEqual({
      name: 'Search Download',
      props: { format: 'json', query: 'prison', filter: 'none', results: '3' },
    });
  });
});
