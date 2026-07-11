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

function layerGeometry(svg: string): string[] {
  return [...svg.matchAll(/<g transform="([^"]+)"><rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)" rx="([^"]+)"/g)]
    .map(match => match.slice(1).join("|"));
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
    const shifted = derivePalette(original, { hue: 180, chroma: 1.2, lightness: 0.04 });
    expect(shifted.accent).toMatch(/^#[0-9a-f]{6}$/);
    expect(shifted.accent).not.toBe(original.colors.accent);
    expect(shifted.base).not.toBe(original.colors.base);
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

  it("renders the exact Figma dark anchors for the reference palette", () => {
    const references: Record<string, string> = {
      bloom: "rose-milk",
      silk: "rose-milk",
      flare: "peach-cream",
      nova: "aurora-pink",
      void: "rose-milk",
      jade: "mint-milk",
    };
    const expected: Record<string, string[]> = {
      bloom: ["#ff7a7c", "#df1c77", "#421d11", "#e22775", "#ff25a1", "#ffb58e"],
      silk: ["#0047c3", "#b4a3ff", "#9086ff", "#1400ae", "#6d56ff", "#4430ff"],
      flare: ["#000000", "#ff9a44", "#f62b0a", "#170312", "#ff8c79"],
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
    expect(reference).toContain("#ff9a44");
    expect(reference).toContain("#f62b0a");
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
    expect(flare).toContain('flood-color="#ff8774" flood-opacity="0.58"');
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
    expect(relativeSrgbChroma(hexToOklch(derived.lobe))).toBeGreaterThanOrEqual(0.739);
    expect(relativeSrgbChroma(hexToOklch(derived.accent))).toBeGreaterThanOrEqual(0.819);
    expect(relativeSrgbChroma(hexToOklch(derived.beam))).toBeGreaterThanOrEqual(0.779);
  });

  it("keeps Flare derivative layers semantically separated", () => {
    const flare = createAvatar({ shape: "flare", palette: "lavender-lime", appearance: "dark", background: null });
    expect(new Set(flare.usedColors.slice(0, 6)).size).toBeGreaterThanOrEqual(5);
  });

  it("uses the tuned dark Flare derivative as its default", () => {
    const defaultFlare = createAvatar({ shape: "flare", palette: "lavender-lime", appearance: "dark", background: null });
    const tunedFlare = createAvatar({
      shape: "flare",
      palette: "lavender-lime",
      appearance: "dark",
      tone: { hue: 227, chroma: 0.45, lightness: -0.18 },
      background: null,
    });
    expect(defaultFlare.usedColors).toEqual(tunedFlare.usedColors);
  });

  it("uses a dark default canvas while preserving explicit transparency", () => {
    const opaque = createAvatar({ appearance: "dark" }).svg;
    const transparent = createAvatar({ appearance: "dark", background: null }).svg;
    expect(opaque).toContain('fill="#0b0b0d"');
    expect(transparent).not.toContain('fill="#0b0b0d"');
  });
});
