import type { AvatarAppearance, PaletteColors, PalettePreset, PaletteToken } from "../types";
import type { DarkColorAnchor, DarkGlowAnchors } from "../data/dark-appearance";
import { darkReferencePalette } from "../data/dark-appearance";
import { palettes } from "../data/palettes";
import { clamp, hexToOklch, maxSrgbChroma, normalizeHue, oklchToHexInGamut, paletteTokenOrder, relativeSrgbChroma } from "./oklch";

const lightReferencePalette = palettes[0].colors;

function hueDelta(target: number, source: number): number {
  const delta = normalizeHue(target - source);
  return delta > 180 ? delta - 360 : delta;
}

export function deriveDarkAnchorColor(
  anchor: DarkColorAnchor,
  palette: PaletteColors,
  referencePalette: PaletteColors = lightReferencePalette,
): string {
  const base = hexToOklch(anchor.color);
  const reference = hexToOklch(referencePalette[anchor.token]);
  const target = hexToOklch(palette[anchor.token]);
  const referenceAccent = hexToOklch(referencePalette.accent);
  const targetAccent = hexToOklch(palette.accent);

  const shift = reference.c >= 0.006 && target.c >= 0.006
    ? hueDelta(target.h, reference.h)
    : hueDelta(targetAccent.h, referenceAccent.h);
  const referenceRelativeChroma = relativeSrgbChroma(reference);
  const targetRelativeChroma = relativeSrgbChroma(target);
  const baseRelativeChroma = relativeSrgbChroma(base);
  const chromaScale = referenceRelativeChroma >= 0.006
    ? clamp(targetRelativeChroma / referenceRelativeChroma, 0.55, 1.45)
    : 1;
  const lightnessShift = clamp((target.l - reference.l) * 0.35, -0.12, 0.12);
  const lightness = clamp(base.l + lightnessShift * (base.c < 0.006 ? 0.5 : 1), 0.03, 0.999999);
  const hue = base.h + shift;
  const relativeChroma = base.c < 0.006 ? 0 : clamp(baseRelativeChroma * chromaScale, 0, 1);

  return oklchToHexInGamut({
    l: lightness,
    c: relativeChroma * maxSrgbChroma(lightness, hue),
    h: hue,
  });
}

export function deriveDarkGlow(
  anchors: DarkGlowAnchors,
  palette: PaletteColors,
  referencePalette: PaletteColors = lightReferencePalette,
): { white: string; glow1: string; glow2: string } {
  return {
    white: deriveDarkAnchorColor(anchors.narrow, palette, referencePalette),
    glow1: deriveDarkAnchorColor(anchors.medium, palette, referencePalette),
    glow2: deriveDarkAnchorColor(anchors.wide, palette, referencePalette),
  };
}

export function deriveAppearanceColor(hex: string, token: PaletteToken, appearance: AvatarAppearance, palette?: PaletteColors): string {
  if (appearance === "light") return hex;
  return deriveDarkAnchorColor({ color: hex, token }, palette ?? lightReferencePalette);
}

export function deriveAppearancePalette(
  palette: PalettePreset | PaletteColors,
  appearance: AvatarAppearance = "light",
  referencePalette: PalettePreset | PaletteColors = lightReferencePalette,
): PaletteColors {
  const colors = "colors" in palette ? palette.colors : palette;
  const referenceColors = "colors" in referencePalette ? referencePalette.colors : referencePalette;
  if (appearance === "light") return { ...colors };

  const next = {} as PaletteColors;
  for (const token of paletteTokenOrder) {
    next[token] = deriveDarkAnchorColor({ color: darkReferencePalette[token], token }, colors, referenceColors);
  }
  return next;
}
