import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchCollection } from './live-list';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchCollection (paged REST)', () => {
  it('reads /count then _start slices and concatenates + de-dupes by id', async () => {
    const rows = Array.from({ length: 3 }, (_, i) => ({ id: i + 1, updatedAt: 'u' }));
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => 3 })          // /count
      .mockResolvedValueOnce({ ok: true, json: async () => rows });       // first slice
    vi.stubGlobal('fetch', fetchMock);
    const out = await fetchCollection('https://h', 'posts', (r) => r, 500);
    expect(out.map((r) => r.id)).toEqual([1, 2, 3]);
    expect(fetchMock).toHaveBeenCalledWith('https://h/posts/count');
  });
  it('returns null on a non-ok response (caller keeps baseline)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    expect(await fetchCollection('https://h', 'posts', (r) => r, 500)).toBeNull();
  });
});
