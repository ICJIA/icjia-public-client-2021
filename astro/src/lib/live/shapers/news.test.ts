import { describe, it, expect } from 'vitest';
import { shapeNewsList } from './news';

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
