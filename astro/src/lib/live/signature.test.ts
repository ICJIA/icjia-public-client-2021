import { describe, it, expect } from "vitest";
import { contentSignature } from "./signature";

describe("contentSignature", () => {
  const a = [
    { id: 1, updatedAt: "2026-01-01" },
    { id: 2, updatedAt: "2026-02-01" },
  ];
  it("is order-independent", () => {
    expect(contentSignature(a)).toBe(contentSignature([...a].reverse()));
  });
  it("changes when an item updatedAt changes (edit)", () => {
    const b = [
      { id: 1, updatedAt: "2026-03-09" },
      { id: 2, updatedAt: "2026-02-01" },
    ];
    expect(contentSignature(a)).not.toBe(contentSignature(b));
  });
  it("changes when an item is removed (delete) or added", () => {
    expect(contentSignature(a)).not.toBe(contentSignature([a[0]]));
    expect(contentSignature(a)).not.toBe(
      contentSignature([...a, { id: 3, updatedAt: "x" }]),
    );
  });
});
