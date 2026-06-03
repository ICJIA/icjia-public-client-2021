/** Order-independent signature over id+updatedAt; detects add/edit/delete. */
export function contentSignature(
  rows: ReadonlyArray<{ id: string | number; updatedAt?: string | null }>,
): string {
  const parts = rows
    .map((r) => `${r.id}:${r.updatedAt ?? ""}`)
    .sort();
  // djb2 over the joined, sorted parts (no crypto dep; collision-safe enough here).
  let h = 5381;
  const s = parts.join("|");
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `${rows.length}.${(h >>> 0).toString(36)}`;
}
