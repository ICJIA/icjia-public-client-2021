import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchHubRows, mergeBakedHubImages } from './gql';

afterEach(() => {
  vi.unstubAllGlobals();
});

const gqlOk = (kind: string, rows: any[]) => ({
  ok: true,
  json: async () => ({ data: { [kind]: rows } }),
});

describe('fetchHubRows (thin GraphQL list — replaces the ~105MB REST read)', () => {
  it('POSTs one inlined-args query and returns the rows', async () => {
    const rows = [{ id: 'a', slug: 's1' }];
    const fetchMock = vi.fn().mockResolvedValue(gqlOk('articles', rows));
    vi.stubGlobal('fetch', fetchMock);

    expect(await fetchHubRows('articles')).toEqual(rows);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://researchhub.icjia-api.cloud/graphql');
    expect(init.method).toBe('POST');
    const q = JSON.parse(init.body).query as string;
    // inline args only — the hub Strapi silently ignores `where` VARIABLES
    expect(q).toContain('where: { status: "published" }');
    expect(q).toContain('sort: "date:desc"');
    expect(q).toContain('limit: 500');
    expect(q).toContain('start: 0');
    // exactly the build's GET_ARTICLE_GROUP_QUERY field set (shapeArticleRow's needs)
    for (const f of ['id', 'title', 'slug', 'abstract', 'authors', 'date', 'tags', 'categories']) {
      expect(q).toMatch(new RegExp(`\\b${f}\\b`));
    }
    // NEVER the heavy fields — they are what made the REST read ~105MB
    for (const heavy of ['splash', 'thumbnail', 'images', 'markdown', 'image']) {
      expect(q).not.toMatch(new RegExp(`\\b${heavy}\\b`));
    }
  });

  it('keeps the apps query thin too (description+contributors, NO base64 image)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(gqlOk('apps', []));
    vi.stubGlobal('fetch', fetchMock);
    await fetchHubRows('apps');
    const q = JSON.parse(fetchMock.mock.calls[0][1].body).query as string;
    expect(q).toContain('description');
    expect(q).toContain('contributors');
    expect(q).not.toMatch(/\bimage\b/);
  });

  it('pages by 500 until a short page and de-dupes by id', async () => {
    const page1 = Array.from({ length: 500 }, (_, i) => ({ id: String(i), slug: `s${i}` }));
    const page2 = [{ id: '499', slug: 's499' }, { id: '500', slug: 's500' }]; // 499 duplicated across pages
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(gqlOk('articles', page1))
      .mockResolvedValueOnce(gqlOk('articles', page2));
    vi.stubGlobal('fetch', fetchMock);

    const out = await fetchHubRows('articles');
    expect(out!.length).toBe(501);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const q2 = JSON.parse(fetchMock.mock.calls[1][1].body).query as string;
    expect(q2).toContain('start: 500');
  });

  it('returns null on !ok, missing data, or network throw (caller keeps baseline)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    expect(await fetchHubRows('datasets')).toBeNull();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ errors: [{}] }) }),
    );
    expect(await fetchHubRows('datasets')).toBeNull();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('net')));
    expect(await fetchHubRows('datasets')).toBeNull();
  });
});

describe('mergeBakedHubImages (live swap must not blank baked thumbnails)', () => {
  const baked = [
    { slug: 'a', ip: '/images/a-splash.jpeg', hasImg: false, t: 'old A' },
    { slug: 'b', ip: null, hasImg: true, t: 'old B' },
  ];
  it('carries baked ip/hasImg onto live rows by slug; new rows stay imageless', () => {
    const live = [
      { slug: 'a', ip: null, hasImg: false, t: 'new A' },
      { slug: 'b', ip: null, hasImg: false, t: 'B' },
      { slug: 'c', ip: null, hasImg: false, t: 'brand new' },
    ];
    const out = mergeBakedHubImages(live as any, baked as any);
    expect(out[0]).toMatchObject({ slug: 'a', ip: '/images/a-splash.jpeg', t: 'new A' });
    expect(out[1]).toMatchObject({ slug: 'b', hasImg: true });
    expect(out[2]).toMatchObject({ slug: 'c', ip: null, hasImg: false });
  });
  it('is pure — neither input is mutated, membership follows live', () => {
    const live = [{ slug: 'c', ip: null, hasImg: false }];
    const liveCopy = JSON.parse(JSON.stringify(live));
    const bakedCopy = JSON.parse(JSON.stringify(baked));
    const out = mergeBakedHubImages(live as any, baked as any);
    expect(live).toEqual(liveCopy);
    expect(baked).toEqual(bakedCopy);
    expect(out.map((r: any) => r.slug)).toEqual(['c']); // deleted baked rows do NOT resurrect
  });
});
