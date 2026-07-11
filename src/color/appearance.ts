import type { AvatarAppearance, PaletteColors, PalettePreset, PaletteToken } from "../types";
import type { DarkColorAnchor, DarkGlowAnchors } from "../data/dark-appearance";
import { darkReferencePalette } from "../data/dark-appearance";
import { palettes } from "../data/palettes";
import { clamp, hexToOklch, maxSrgbChroma, oklchToHexInGamut, paletteTokenOrder, relativeSrgbChroma } from "./oklch";

const lightReferencePalette = palettes[0].colors;

const darkRelativeChromaFloor: Record<PaletteToken, number> = {
  base: 0.58,
  lobe: 0.74,
  accent: 0.82,
  pale: 0.68,
  light: 0,
  warm: 0.76,
  cool: 0.72,
  dark: 0.42,
  beam: 0.78,
};

export function deriveDarkAnchorColor(
  anchor: DarkColorAnchor,
  palette: PaletteColors,
  referencePalette: PaletteColors = lightReferencePalette,
  chromaFloorScale = 1,
): string {
  const base = hexToOklch(anchor.color);
  const reference = hexToOklch(referencePalette[anchor.token]);
  const target = hexToOklch(palette[anchor.token]);
  const targetAccent = hexToOklch(palette.accent);
  const referenceRelativeChroma = relativeSrgbChroma(reference);
  const targetRelativeChroma = relativeSrgbChroma(target);
  const baseRelativeChroma = relativeSrgbChroma(base);
  const isReferencePalette = paletteTokenOrder.every(
    token => palette[token].toLowerCase() === referencePalette[token].toLowerCase(),
  );
  const toneChroma = clamp(chromaFloorScale, 0, 1);
  const fullTargetRelativeChroma = toneChroma > 0.0001
    ? clamp(targetRelativeChroma / toneChroma, 0, 1)
    : referenceRelativeChroma;
  const transferredRelativeChroma = clamp(
    baseRelativeChroma + fullTargetRelativeChroma - referenceRelativeChroma,
    0,
    1,
  );
  const lightness = clamp(base.l + target.l - reference.l, 0.03, 0.999999);
  const hue = isReferencePalette ? base.h : target.c >= 0.006 ? target.h : targetAccent.h;
  const relativeChroma = base.c < 0.006
    ? 0
    : isReferencePalette
      ? baseRelativeChroma
      : toneChroma * Math.max(transferredRelativeChroma, darkRelativeChromaFloor[anchor.token]);

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
  chromaFloorScale = 1,
): { white: string; glow1: string; glow2: string } {
  return {
    white: deriveDarkAnchorColor(anchors.narrow, palette, referencePalette, chromaFloorScale),
    glow1: deriveDarkAnchorColor(anchors.medium, palette, referencePalette, chromaFloorScale),
    glow2: deriveDarkAnchorColor(anchors.wide, palette, referencePalette, chromaFloorScale),
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
  chromaFloorScale = 1,
): PaletteColors {
  const colors = "colors" in palette ? palette.colors : palette;
  const referenceColors = "colors" in referencePalette ? referencePalette.colors : referencePalette;
  if (appearance === "light") return { ...colors };

  const next = {} as PaletteColors;
  for (const token of paletteTokenOrder) {
    next[token] = deriveDarkAnchorColor({ color: darkReferencePalette[token], token }, colors, referenceColors, chromaFloorScale);
  }
  return next;
}
