import { describe, it, expect } from 'vitest';
import { shapeNewsList, shapeNewsRow } from './news';

const raw = [{
  id: 7, title: 'T', slug: 't', summary: 'S', category: 'cat',
  published_at: '2026-05-01T00:00:00.000Z', dateOverride: '',
  tags: [{ title: 'a' }, { title: 'b' }], splash: { url: '/u.jpg' },
}];

describe('shapeNewsList (relocated, pure)', () => {
  it('flattens tags, derives publicationDate + fullPath', () => {
    const [it0] = shapeNewsList(raw);
    expect(it0.tags).toEqual(['a', 'b']);
    expect(it0.publicationDate).toBe('2026-05-01T00:00:00.000Z');
    expect(it0.fullPath).toBe('/news/t/');
  });
  it('prefers dateOverride when present', () => {
    const [it0] = shapeNewsList([{ ...raw[0], dateOverride: '2026-06-01' }]);
    expect(it0.publicationDate).toBe('2026-06-01');
  });
});

describe('shapeNewsRow (client live-island shaper)', () => {
  const rawPost = {
    id: 42,
    title: 'Test Article',
    slug: 'test-article',
    summary: 'One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two twenty-three twenty-four twenty-five extra',
    category: 'pressRelease',
    published_at: '2026-05-14T12:00:00.000Z',
    dateOverride: '',
    updated_at: '2026-05-15T08:00:00.000Z',
    splash: { url: '/uploads/img.jpg' },
  };

  it('produces the expected compact shape', () => {
    const row = shapeNewsRow(rawPost);
    expect(row.id).toBe('42');
    expect(row.p).toBe('/news/test-article/');
    expect(row.t).toBe('Test Article');
    expect(row.cl).toBe('PRESS RELEASE');
    expect(row.c).toBe('pressRelease');
    expect(row.d).toBe('May 14, 2026');
    expect(row.pd).toBe('2026-05-14T12:00:00.000Z'); // sortable ISO key (newest-first)
    expect(row.img).toBe('/uploads/img.jpg');
    // summary truncated at 25 words
    expect(row.s.endsWith('...')).toBe(true);
    const wordCount = row.s.replace(/\.\.\.$/, '').trim().split(/\s+/).length;
    expect(wordCount).toBe(25);
  });

  it('prefers dateOverride for publicationDate when present', () => {
    const row = shapeNewsRow({ ...rawPost, dateOverride: '2026-06-01' });
    expect(row.d).toBe('June 01, 2026');
  });

  it('null img when no splash', () => {
    const row = shapeNewsRow({ ...rawPost, splash: null });
    expect(row.img).toBeNull();
  });

  it('updatedAt exposed for contentSignature', () => {
    const row = shapeNewsRow(rawPost);
    expect(row.updatedAt).toBe('2026-05-15T08:00:00.000Z');
  });

  it('falls back to updatedAt camelCase field', () => {
    const { updated_at, ...noSnake } = rawPost as any;
    const row = shapeNewsRow({ ...noSnake, updatedAt: '2026-05-16T00:00:00.000Z' });
    expect(row.updatedAt).toBe('2026-05-16T00:00:00.000Z');
  });
});
