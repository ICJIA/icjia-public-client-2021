/**
 * Parity tests for helpers relocated from data.ts → shapers/format.ts.
 * Each test asserts the SAME output the original data.ts version produced
 * for representative inputs, confirming the relocation is faithful.
 */
import { describe, it, expect } from 'vitest';
import { truncateWords, isNew, formatNewsDate, newsCategoryLabel } from './format';

// ── truncateWords (parity with data.ts) ──────────────────────────────────────

describe('truncateWords (parity)', () => {
  it("returns '' for empty/undefined", () => {
    expect(truncateWords()).toBe('');
    expect(truncateWords('')).toBe('');
  });
  it('keeps text within the limit unchanged (no ellipsis)', () => {
    expect(truncateWords('a b c', 5)).toBe('a b c');
  });
  it('truncates to N words + ellipsis', () => {
    expect(truncateWords('one two three four', 2)).toBe('one two...');
  });
  it('collapses runs of whitespace', () => {
    expect(truncateWords('  one   two   three ', 2)).toBe('one two...');
  });
  it('exact word count at boundary — no ellipsis', () => {
    expect(truncateWords('a b c', 3)).toBe('a b c');
  });
});

// ── isNew (parity with data.ts) ───────────────────────────────────────────────

describe('isNew (parity)', () => {
  it('true for a just-published date', () => {
    expect(isNew(new Date().toISOString())).toBe(true);
  });
  it('false for an old date', () => {
    expect(isNew('2000-01-01T00:00:00Z')).toBe(false);
  });
  it('false for missing/invalid', () => {
    expect(isNew()).toBe(false);
    expect(isNew('nope')).toBe(false);
  });
  it('honours custom days parameter', () => {
    // 3 days ago — within 5 days but outside 2 days
    const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString();
    expect(isNew(threeDaysAgo, 5)).toBe(true);
    expect(isNew(threeDaysAgo, 2)).toBe(false);
  });
});

// ── formatNewsDate (parity with data.ts) ──────────────────────────────────────

describe('formatNewsDate (parity)', () => {
  it('zero-pads the day', () => {
    expect(formatNewsDate('2026-05-14T12:00:00Z')).toBe('May 14, 2026');
    expect(formatNewsDate('2026-01-05T00:00:00Z')).toBe('January 05, 2026');
  });
  it('empty for missing/invalid', () => {
    expect(formatNewsDate()).toBe('');
    expect(formatNewsDate('not-a-date')).toBe('');
  });
  it('all twelve months', () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    months.forEach((m, i) => {
      const mm = String(i + 1).padStart(2, '0');
      expect(formatNewsDate(`2026-${mm}-15T00:00:00Z`)).toBe(`${m} 15, 2026`);
    });
  });
});

// ── newsCategoryLabel (parity with data.ts) ────────────────────────────────────

describe('newsCategoryLabel (parity)', () => {
  it('known categories', () => {
    expect(newsCategoryLabel('news')).toBe('News');
    expect(newsCategoryLabel('pressRelease')).toBe('Press Release');
    expect(newsCategoryLabel('outreach')).toBe('Community Outreach');
    expect(newsCategoryLabel('mediaAdvisory')).toBe('Media Advisory');
  });
  it('unknown/missing → "News" (default)', () => {
    expect(newsCategoryLabel('unknown')).toBe('News');
    expect(newsCategoryLabel()).toBe('News');
    expect(newsCategoryLabel('')).toBe('News');
  });
});
