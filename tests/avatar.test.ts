import { describe, expect, it } from "vitest";
import { createAvatar, derivePalette, palettes, shapes } from "../src";

describe("@oreo-ui/avatar", () => {
  it("ships six shape families and forty palette presets", () => {
    expect(shapes).toHaveLength(6);
    expect(palettes).toHaveLength(40);
  });

  it("creates a fixed 64x64 SVG by default", () => {
    const avatar = createAvatar({ shape: "bloom", palette: "rose-milk" });
    expect(avatar.svg).toContain('width="64"');
    expect(avatar.svg).toContain('height="64"');
    expect(avatar.svg).toContain("<clipPath");
    expect(avatar.svg).not.toContain("drop-shadow");
  });

  it("derives the whole palette through OKLCH tone controls", () => {
    const original = palettes[0];
    const shifted = derivePalette(original, { hue: 180, chroma: 1.2, lightness: 0.04 });
    expect(shifted.accent).toMatch(/^#[0-9a-f]{6}$/);
    expect(shifted.accent).not.toBe(original.colors.accent);
    expect(shifted.base).not.toBe(original.colors.base);
  });

  it("renders a distinct dark-theme variant for every palette", () => {
    for (const preset of palettes) {
      const light = createAvatar({ shape: "bloom", palette: preset.id });
      const dark = createAvatar({ shape: "bloom", palette: preset.id, theme: "dark" });
      expect(dark.svg).not.toBe(light.svg);
      expect(dark.colors.base).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("keeps variant output deterministic", () => {
    const first = createAvatar({ shape: "void", palette: "teal-void", variantId: "same", drift: 12 }).svg;
    const second = createAvatar({ shape: "void", palette: "teal-void", variantId: "same", drift: 12 }).svg;
    const third = createAvatar({ shape: "void", palette: "teal-void", variantId: "other", drift: 12 }).svg;
    expect(first).toBe(second);
    expect(first).not.toBe(third);
  });
});
