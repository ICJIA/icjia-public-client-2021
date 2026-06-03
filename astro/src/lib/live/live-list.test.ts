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

  it('pages across multiple slices when count > size and concatenates in order', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => 3 })                                                  // /count
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 1, updatedAt: 'u' }, { id: 2, updatedAt: 'u' }] }) // _start=0
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 3, updatedAt: 'u' }] });                          // _start=2
    vi.stubGlobal('fetch', fetchMock);
    const out = await fetchCollection('https://h', 'posts', (r) => r, 2);
    expect(out!.map((r) => r.id)).toEqual([1, 2, 3]);
    expect(fetchMock).toHaveBeenCalledTimes(3); // 1 count + 2 slices
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://h/posts?_limit=2&_start=0');
    expect(fetchMock).toHaveBeenNthCalledWith(3, 'https://h/posts?_limit=2&_start=2');
  });

  it('returns null on a malformed (non-array) slice response', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => 1 })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) }); // wrapped, not a bare array
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchCollection('https://h', 'posts', (r) => r, 500)).toBeNull();
  });
});
