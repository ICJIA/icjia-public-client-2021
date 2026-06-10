import { describe, it, expect, vi, afterEach } from 'vitest';
import { restProbe, hubProbe, probeUnchanged, stampOf, buildProbe } from './probe';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('stampOf (REST/GraphQL timestamp normalization)', () => {
  it('prefers snake_case updated_at (agency REST)', () => {
    expect(stampOf({ updated_at: 'A', updatedAt: 'B' })).toBe('A');
  });
  it('falls back to camelCase updatedAt (hub)', () => {
    expect(stampOf({ updatedAt: 'B' })).toBe('B');
  });
  it('returns empty string when absent or row missing', () => {
    expect(stampOf({})).toBe('');
    expect(stampOf(undefined)).toBe('');
  });
});

describe('restProbe (count + latest updated_at, 2 small GETs)', () => {
  it('returns {n,u} from /count and the _sort=updated_at:DESC&_limit=1 row', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/count')) return Promise.resolve({ ok: true, json: async () => 288 });
      return Promise.resolve({ ok: true, json: async () => [{ updated_at: '2026-06-09T19:42:15.666Z' }] });
    });
    vi.stubGlobal('fetch', fetchMock);
    const out = await restProbe('https://h', 'meetings');
    expect(out).toEqual({ n: 288, u: '2026-06-09T19:42:15.666Z' });
    expect(fetchMock).toHaveBeenCalledWith('https://h/meetings/count');
    expect(fetchMock).toHaveBeenCalledWith('https://h/meetings?_sort=updated_at:DESC&_limit=1');
  });

  it('appends an extra query to BOTH calls (hub-style status gate)', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/count')) return Promise.resolve({ ok: true, json: async () => 5 });
      return Promise.resolve({ ok: true, json: async () => [{ updatedAt: 'u1' }] });
    });
    vi.stubGlobal('fetch', fetchMock);
    const out = await restProbe('https://h', 'datasets', 'status=published');
    expect(out).toEqual({ n: 5, u: 'u1' });
    expect(fetchMock).toHaveBeenCalledWith('https://h/datasets/count?status=published');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://h/datasets?_sort=updated_at:DESC&_limit=1&status=published',
    );
  });

  it('returns {n, u:""} for an empty collection (count 0, empty list)', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/count')) return Promise.resolve({ ok: true, json: async () => 0 });
      return Promise.resolve({ ok: true, json: async () => [] });
    });
    vi.stubGlobal('fetch', fetchMock);
    expect(await restProbe('https://h', 'events')).toEqual({ n: 0, u: '' });
  });

  it('returns null on a non-ok response, non-numeric count, non-array latest, or throw', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    expect(await restProbe('https://h', 'posts')).toBeNull();

    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        Promise.resolve({ ok: true, json: async () => (url.includes('/count') ? 'NaN!' : []) }),
      ),
    );
    expect(await restProbe('https://h', 'posts')).toBeNull();

    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        Promise.resolve({
          ok: true,
          json: async () => (url.includes('/count') ? 3 : { rows: [] }),
        }),
      ),
    );
    expect(await restProbe('https://h', 'posts')).toBeNull();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('net')));
    expect(await restProbe('https://h', 'posts')).toBeNull();
  });
});

describe('hubProbe (one GraphQL POST: Connection count + latest updatedAt)', () => {
  it('POSTs a single query with the published gate and returns {n,u}', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          articlesConnection: { aggregate: { count: 252 } },
          articles: [{ updatedAt: '2026-06-05T15:24:32.021Z' }],
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const out = await hubProbe('articles');
    expect(out).toEqual({ n: 252, u: '2026-06-05T15:24:32.021Z' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://researchhub.icjia-api.cloud/graphql');
    expect(init.method).toBe('POST');
    const q = JSON.parse(init.body).query as string;
    expect(q).toContain('articlesConnection(where: { status: "published" })');
    expect(q).toContain('sort: "updatedAt:desc"');
    expect(q).toContain('limit: 1');
  });

  it('returns {n, u:""} when the collection is empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { appsConnection: { aggregate: { count: 0 } }, apps: [] } }),
      }),
    );
    expect(await hubProbe('apps')).toEqual({ n: 0, u: '' });
  });

  it('returns null on !ok, missing data, or throw', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    expect(await hubProbe('datasets')).toBeNull();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ errors: [{ message: 'x' }] }) }),
    );
    expect(await hubProbe('datasets')).toBeNull();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('net')));
    expect(await hubProbe('datasets')).toBeNull();
  });
});

describe('buildProbe (SourceKey → the probe matching that island\'s fetch transport)', () => {
  it('routes agency keys to REST (same host/collection as fetchCollection)', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/count')) return Promise.resolve({ ok: true, json: async () => 107 });
      return Promise.resolve({ ok: true, json: async () => [{ updated_at: 'g1' }] });
    });
    vi.stubGlobal('fetch', fetchMock);
    expect(await buildProbe('funding')).toEqual({ n: 107, u: 'g1' });
    expect(fetchMock).toHaveBeenCalledWith('https://agency.icjia-api.cloud/grants/count');
  });
  it('routes hub keys to the GraphQL probe (never hub REST)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { articlesConnection: { aggregate: { count: 252 } }, articles: [{ updatedAt: 'h1' }] },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    expect(await buildProbe('hubArticles')).toEqual({ n: 252, u: 'h1' });
    expect(fetchMock.mock.calls[0][0]).toBe('https://researchhub.icjia-api.cloud/graphql');
  });
});

describe('probeUnchanged (baked vs live)', () => {
  const baked = { n: 10, u: '2026-06-01T00:00:00.000Z' };
  it('true only when BOTH count and latest stamp match', () => {
    expect(probeUnchanged(baked, { n: 10, u: '2026-06-01T00:00:00.000Z' })).toBe(true);
    expect(probeUnchanged(baked, { n: 11, u: '2026-06-01T00:00:00.000Z' })).toBe(false); // add/delete
    expect(probeUnchanged(baked, { n: 10, u: '2026-06-02T00:00:00.000Z' })).toBe(false); // edit
  });
  it('false (→ full fetch) when either side is missing — probe only ever PROVES freshness', () => {
    expect(probeUnchanged(null, { n: 10, u: 'x' })).toBe(false);
    expect(probeUnchanged(undefined, { n: 10, u: 'x' })).toBe(false);
    expect(probeUnchanged(baked, null)).toBe(false);
  });
});
