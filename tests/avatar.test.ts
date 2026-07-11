import { describe, expect, it } from "vitest";
import {
  createAvatar,
  darkReferencePalette,
  deriveAppearancePalette,
  derivePalette,
  hexToOklch,
  palettes,
  relativeSrgbChroma,
  shapes,
} from "../src";
import { darkShapeAnchors } from "../src/data/dark-appearance";
import { darkFlarePaletteOverrides } from "../src/data/dark-flare-palettes";
import { deriveDarkAnchorColor } from "../src/color/appearance";

function layerGeometry(svg: string): string[] {
  return [...svg.matchAll(/<g transform="([^"]+)"><rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)" rx="([^"]+)"/g)]
    .map(match => match.slice(1).join("|"));
}

function hueDistance(a: number, b: number): number {
  const distance = Math.abs(a - b) % 360;
  return Math.min(distance, 360 - distance);
}

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

  it("uses size as display scale without recalculating internal geometry", () => {
    const options = { shape: "flare" as const, palette: "rose-milk", appearance: "dark" as const, variantId: "scale", drift: 8, background: null };
    const small = createAvatar({ ...options, size: 64 }).svg;
    const large = createAvatar({ ...options, size: 192 }).svg;
    const normalizeOuterSize = (svg: string): string => svg.replace(/<svg([^>]*?)width="\d+" height="\d+"/, '<svg$1width="SIZE" height="SIZE"');

    expect(large).toContain('width="192" height="192" viewBox="0 0 64 64"');
    expect(normalizeOuterSize(large)).toBe(normalizeOuterSize(small));
  });

  it("derives the whole palette through OKLCH tone controls", () => {
    const original = palettes[0];
    const shifted = derivePalette(original, { hue: 180, chroma: 0.8, lightness: 0.04 });
    expect(shifted.accent).toMatch(/^#[0-9a-f]{6}$/);
    expect(shifted.accent).not.toBe(original.colors.accent);
    expect(shifted.base).not.toBe(original.colors.base);
  });

  it("applies zero relative chroma to every painted dark color", () => {
    const avatar = createAvatar({
      shape: "flare",
      palette: "lemon-mint",
      appearance: "dark",
      tone: { chroma: 0 },
      background: null,
    });
    for (const color of avatar.usedColors) {
      expect(relativeSrgbChroma(hexToOklch(color))).toBeLessThan(0.01);
    }
  });

  it("keeps variant output deterministic", () => {
    const first = createAvatar({ shape: "void", palette: "teal-void", variantId: "same", drift: 12 }).svg;
    const second = createAvatar({ shape: "void", palette: "teal-void", variantId: "same", drift: 12 }).svg;
    const third = createAvatar({ shape: "void", palette: "teal-void", variantId: "other", drift: 12 }).svg;
    expect(first).toBe(second);
    expect(first).not.toBe(third);
  });

  it("uses the Figma dark reference palette as the zero-offset dark appearance", () => {
    expect(deriveAppearancePalette(palettes[0], "dark")).toEqual(darkReferencePalette);
  });

  it("renders the configured dark anchors for the reference palette", () => {
    const references: Record<string, string> = {
      bloom: "rose-milk",
      silk: "rose-milk",
      flare: "peach-cream",
      nova: "aurora-pink",
      void: "rose-milk",
      jade: "jade-cream",
    };
    const expected: Record<string, string[]> = {
      bloom: ["#ff7a7c", "#df1c77", "#421d11", "#e22775", "#ff25a1", "#ffb58e"],
      silk: ["#0047c3", "#b4a3ff", "#9086ff", "#1400ae", "#6d56ff", "#4430ff"],
      flare: ["#000000", "#ff7700", "#ff9d47", "#ffa200", "#f12809", "#170312", "#ff8c79"],
      nova: ["#6550b9", "#ffffff", "#ff0084", "#6aa7ff"],
      void: ["#031a05", "#4229ff", "#57b565", "#000000"],
      jade: ["#031a05", "#08b98d", "#0f9a73", "#5fec83", "#ffffff"],
    };
    for (const shape of shapes) {
      const svg = createAvatar({ shape: shape.id, palette: references[shape.id]!, appearance: "dark", background: null }).svg;
      for (const color of expected[shape.id]!) expect(svg).toContain(color);
    }
  });

  it("derives dark saturation from relative sRGB chroma", () => {
    const muted = relativeSrgbChroma(hexToOklch("#fff2ce"));
    const vivid = relativeSrgbChroma(hexToOklch("#ff6044"));
    expect(muted).toBeGreaterThanOrEqual(0);
    expect(vivid).toBeLessThanOrEqual(1);
    expect(vivid).toBeGreaterThan(muted);

    const reference = createAvatar({ shape: "flare", palette: "peach-cream", appearance: "dark", background: null }).svg;
    expect(reference).toContain("#ff7700");
    expect(reference).toContain("#ff9d47");
    expect(reference).toContain("#ffa200");
    expect(reference).toContain("#f12809");
  });

  it("preserves every shape layer geometry between light and dark appearances", () => {
    for (const shape of shapes) {
      const light = createAvatar({ shape: shape.id, palette: "sunset-punch", variantId: "theme", drift: 0 }).svg;
      const dark = createAvatar({ shape: shape.id, palette: "sunset-punch", variantId: "theme", drift: 0, appearance: "dark" }).svg;
      expect(layerGeometry(dark)).toEqual(layerGeometry(light));
      expect(dark).not.toBe(light);
    }
  });

  it("keeps the browser-faithful Figma dark effect structure and full layer opacity", () => {
    const bloom = createAvatar({ shape: "bloom", palette: "rose-milk", appearance: "dark", background: null, drift: 0 }).svg;
    const silk = createAvatar({ shape: "silk", palette: "rose-milk", appearance: "dark", background: null, drift: 0 }).svg;
    const flare = createAvatar({ shape: "flare", palette: "peach-cream", appearance: "dark", background: null, drift: 0 }).svg;

    expect(bloom).toMatch(/filter="url\(#dark-frame-oreo-[a-z0-9]+\)"/);
    expect(bloom).not.toContain("feTurbulence");
    expect(bloom).toContain('stdDeviation="3.224692"');
    expect(bloom).toContain('flood-color="#ffb58e" flood-opacity="1"');
    expect(bloom).toContain('flood-color="#ff25a1" flood-opacity="1"');
    expect(bloom).toContain('flood-color="#e22775" flood-opacity="1"');
    expect(bloom).not.toContain('opacity="0.860"');
    expect(bloom).toContain('<rect width="64" height="64" rx="32" fill="#ffffff"/>');
    expect(bloom).toContain('mask="url(#edge-mask-');
    expect(bloom).toContain('stop-opacity="0"');
    expect(bloom).not.toContain('shape-rendering="geometricPrecision"');
    expect(flare).toContain('flood-color="#ff8c79" flood-opacity="0.72"');
    expect(flare).toContain('flood-color="#c4321c" flood-opacity="0.58"');
    expect(flare).toContain('flood-color="#ffffff" flood-opacity="0.32"');
    expect(flare).toContain('stdDeviation="5.614035"');
    expect(flare).toContain('stdDeviation="2.245614"');
    expect(flare).toContain('stdDeviation="1.122807"');
    expect(flare).not.toContain("feTurbulence");
    expect(silk).toContain('gradientTransform="translate(-0.03 -15.355) rotate(89.9503) scale(36.7093 41.0794)"');
    expect(silk).toContain('stdDeviation="12.698412"');
  });

  it("reports the colors actually painted by the selected dark shape", () => {
    const flare = createAvatar({ shape: "flare", palette: "cherry-cola", appearance: "dark", background: null });
    const light = createAvatar({ shape: "flare", palette: "cherry-cola", appearance: "light", background: null });
    expect(flare.usedColors).toHaveLength(9);
    expect(light.usedColors).toHaveLength(9);
    for (const color of flare.usedColors) expect(flare.svg).toContain(color);
    for (const color of light.usedColors) expect(light.svg).toContain(color);
    expect(flare.usedColors).not.toContain(flare.colors.beam);
  });

  it("keeps derived middle colors above their relative-chroma floors", () => {
    const cherryCola = palettes.find(palette => palette.id === "cherry-cola")!;
    const derived = deriveAppearancePalette(cherryCola, "dark");
    expect(relativeSrgbChroma(hexToOklch(derived.lobe))).toBeGreaterThanOrEqual(0.98);
    expect(relativeSrgbChroma(hexToOklch(derived.accent))).toBeGreaterThanOrEqual(0.98);
    expect(relativeSrgbChroma(hexToOklch(derived.beam))).toBeGreaterThanOrEqual(0.98);
  });

  it("keeps Flare derivative layers semantically separated", () => {
    const flare = createAvatar({ shape: "flare", palette: "lavender-lime", appearance: "dark", background: null });
    expect(new Set(flare.usedColors.slice(0, 6)).size).toBeGreaterThanOrEqual(5);
  });

  it("derives every visible dark Flare layer from its matching light layer", () => {
    for (const palette of palettes) {
      const light = createAvatar({ shape: "flare", palette, appearance: "light", background: null, drift: 0 });
      const dark = createAvatar({ shape: "flare", palette, appearance: "dark", background: null, drift: 0 });

      for (const index of [1, 2, 4, 5]) {
        const lightColor = hexToOklch(light.usedColors[index]!);
        const darkColor = hexToOklch(dark.usedColors[index]!);
        expect(darkColor.l).toBeLessThan(lightColor.l);
        if (palette.id !== "peach-cream" && !darkFlarePaletteOverrides[palette.id] && lightColor.c >= 0.006 && darkColor.c >= 0.03 && darkColor.l > 0.06) {
          expect(hueDistance(darkColor.h, lightColor.h)).toBeLessThan(4);
        }
      }
    }
  });

  it("uses hand-authored dark Flare palettes for collapsed color directions", () => {
    expect(Object.keys(darkFlarePaletteOverrides)).toHaveLength(40);
    expect(Object.keys(darkFlarePaletteOverrides).sort()).toEqual(palettes.map(palette => palette.id).sort());
    for (const [palette, colors] of Object.entries(darkFlarePaletteOverrides)) {
      const flare = createAvatar({ shape: "flare", palette, appearance: "dark", background: null, drift: 0 });
      expect(flare.usedColors.slice(0, 6)).toEqual([
        colors!.dark,
        colors!.lobe,
        colors!.pale,
        colors!.light,
        colors!.warm,
        colors!.accent,
      ]);
    }
  });

  it("maps dark Flare layers to their matching light Figma roles", () => {
    const flare = darkShapeAnchors.flare;
    expect(Object.fromEntries(Object.entries(flare.layers).map(([name, anchor]) => [name, anchor.token]))).toEqual({
      dark: "dark",
      base: "lobe",
      cream1: "pale",
      cream2: "light",
      hot1: "warm",
      hot2: "accent",
    });
    expect([flare.frameGlow.narrow.token, flare.frameGlow.medium.token, flare.frameGlow.wide.token]).toEqual([
      "light",
      "pale",
      "beam",
    ]);
  });

  it("keeps a derived palette's token hues consistent across dark shapes", () => {
    const lemonMint = palettes.find(palette => palette.id === "lemon-mint")!;
    const samples = [
      { shape: "flare" as const, layer: "cream1" },
      { shape: "silk" as const, layer: "warm" },
      { shape: "bloom" as const, layer: "blob" },
    ];

    for (const sample of samples) {
      const shape = darkShapeAnchors[sample.shape];
      const anchor = shape.layers[sample.layer]!;
      const reference = palettes.find(palette => palette.id === shape.lightReference)!;
      const derived = hexToOklch(deriveDarkAnchorColor(anchor, lemonMint.colors, reference.colors));
      const target = hexToOklch(lemonMint.colors[anchor.token]);
      expect(hueDistance(derived.h, target.h)).toBeLessThan(4);
    }
  });

  it("preserves light palette contrast in matching dark layers", () => {
    const lavenderLime = palettes.find(palette => palette.id === "lavender-lime")!;
    const magentaVoid = palettes.find(palette => palette.id === "magenta-void")!;
    const lightDelta = Math.abs(hexToOklch(lavenderLime.colors.lobe).l - hexToOklch(magentaVoid.colors.lobe).l);
    const lavenderDark = createAvatar({ shape: "flare", palette: lavenderLime, appearance: "dark", background: null });
    const magentaDark = createAvatar({ shape: "flare", palette: magentaVoid, appearance: "dark", background: null });
    const darkDelta = Math.abs(hexToOklch(lavenderDark.usedColors[1]!).l - hexToOklch(magentaDark.usedColors[1]!).l);

    expect(darkDelta / lightDelta).toBeGreaterThan(0.8);
  });

  it("uses the authored dark Flare preset as its default", () => {
    const flare = createAvatar({ shape: "flare", palette: "lavender-lime", appearance: "dark", background: null });
    const colors = darkFlarePaletteOverrides["lavender-lime"]!;
    expect(flare.usedColors.slice(0, 6)).toEqual([colors.dark, colors.lobe, colors.pale, colors.light, colors.warm, colors.accent]);
  });

  it("uses the tuned dark Bloom derivative as its default", () => {
    const defaultBloom = createAvatar({ shape: "bloom", palette: "lavender-lime", appearance: "dark", background: null });
    const tunedBloom = createAvatar({
      shape: "bloom",
      palette: "lavender-lime",
      appearance: "dark",
      tone: { chroma: 1, lightness: -0.1 },
      background: null,
    });
    expect(defaultBloom.usedColors).toEqual(tunedBloom.usedColors);
  });

  it("uses a dark default canvas while preserving explicit transparency", () => {
    const opaque = createAvatar({ appearance: "dark" }).svg;
    const transparent = createAvatar({ appearance: "dark", background: null }).svg;
    expect(opaque).toContain('fill="#0b0b0d"');
    expect(transparent).not.toContain('fill="#0b0b0d"');
  });
});
