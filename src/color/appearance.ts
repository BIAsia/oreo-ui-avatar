import type { AvatarAppearance, PaletteColors, PalettePreset, PaletteToken } from "../types";
import type { DarkColorAnchor, DarkGlowAnchors } from "../data/dark-appearance";
import { darkReferencePalette } from "../data/dark-appearance";
import { palettes } from "../data/palettes";
import { clamp, hexToOklch, maxSrgbChroma, normalizeHue, oklchToHexInGamut, paletteTokenOrder, relativeSrgbChroma } from "./oklch";

const lightReferencePalette = palettes[0].colors;

const darkRelativeChromaFloor: Record<PaletteToken, number> = {
  base: 1,
  lobe: 1,
  accent: 1,
  pale: 1,
  light: 1,
  warm: 1,
  cool: 1,
  dark: 1,
  beam: 1,
};

const darkLightnessDelta = 0.86;
const darkChromaDelta = 0.86;

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
    baseRelativeChroma + (fullTargetRelativeChroma - referenceRelativeChroma) * darkChromaDelta,
    0,
    1,
  );
  const lightness = clamp(base.l + (target.l - reference.l) * darkLightnessDelta, 0.03, 0.999999);
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

/**
 * Flare is derived layer-for-layer from its rendered light palette. The Figma
 * Peach Cream pair supplies each layer's darkening ratio and bounded hue move,
 * both applied to the selected light layer itself. This prevents unrelated
 * utility tokens from being introduced while preserving the authored hierarchy.
 */
export function deriveDarkFlareLayerColor(
  anchor: DarkColorAnchor,
  palette: PaletteColors,
  referencePalette: PaletteColors,
  chromaFloorScale = 1,
): string {
  const dark = hexToOklch(anchor.color);
  const referenceLight = hexToOklch(referencePalette[anchor.token]);
  const targetLight = hexToOklch(palette[anchor.token]);
  const targetAccent = hexToOklch(palette.accent);
  const isReferencePalette = paletteTokenOrder.every(
    token => palette[token].toLowerCase() === referencePalette[token].toLowerCase(),
  );

  if (isReferencePalette) return anchor.color.toLowerCase();

  const toneChroma = clamp(chromaFloorScale, 0, 1);
  const lightnessRatio = referenceLight.l > 0.0001 ? dark.l / referenceLight.l : 1;
  const lightness = clamp(targetLight.l * lightnessRatio, 0.03, 0.999999);
  const sourceHue = targetLight.c >= 0.006 ? targetLight.h : targetAccent.h;
  const referenceHueDelta = ((dark.h - referenceLight.h + 540) % 360) - 180;
  const hue = normalizeHue(sourceHue + referenceHueDelta);
  const relativeChroma = dark.c < 0.006 ? 0 : toneChroma;

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
