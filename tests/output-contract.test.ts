import { describe, expect, it } from "vitest";
import { createAvatar } from "../src/index";
import type { AvatarAppearance, ShapeId } from "../src/types";

function extractIds(svg: string): string[] {
  return [...svg.matchAll(/ id="([^"]+)"/g)].map((match) => match[1] ?? "");
}

describe("inline SVG id safety", () => {
  it("keeps every def id unique inside a single avatar", () => {
    for (const appearance of ["light", "dark"] as const) {
      const avatar = createAvatar({ shape: "flare", palette: "aurora-pink", appearance });
      const ids = extractIds(avatar.svg);
      expect(ids.length).toBeGreaterThan(0);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("never shares ids between different avatars rendered into the same document", () => {
    const a = createAvatar({ shape: "bloom", palette: "rose-milk" });
    const b = createAvatar({ shape: "bloom", palette: "mint-milk" });
    const c = createAvatar({ shape: "nova", palette: "rose-milk", appearance: "dark" });
    const idsA = new Set(extractIds(a.svg));
    for (const other of [b, c]) {
      const shared = extractIds(other.svg).filter((id) => idsA.has(id));
      expect(shared).toEqual([]);
    }
  });

  it("resolves every internal url(#...) reference against its own defs", () => {
    const avatar = createAvatar({ shape: "void", palette: "magenta-void", appearance: "dark", variantId: "ref-check" });
    const ids = new Set(extractIds(avatar.svg));
    const references = [...avatar.svg.matchAll(/url\(#([^)]+)\)/g)].map((match) => match[1] ?? "");
    expect(references.length).toBeGreaterThan(0);
    for (const reference of references) {
      expect(ids).toContain(reference);
    }
  });
});

describe("golden output", () => {
  // These snapshots lock the public output contract: identical options must
  // keep producing byte-identical SVG across releases. Intentional visual
  // changes require a snapshot update and a version bump note.
  const cases: Array<[ShapeId, string, AvatarAppearance]> = [
    ["bloom", "rose-milk", "light"],
    ["silk", "lilac-silk", "light"],
    ["flare", "aurora-pink", "dark"],
    ["nova", "sky-melon", "light"],
    ["void", "magenta-void", "dark"],
    ["jade", "jade-cream", "dark"],
  ];

  it.each(cases)("locks %s / %s / %s", (shape, palette, appearance) => {
    const avatar = createAvatar({ shape, palette, appearance, variantId: "golden", drift: 8 });
    expect(avatar.svg).toMatchSnapshot();
  });
});
