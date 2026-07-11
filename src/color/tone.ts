import type { PaletteColors, PalettePreset, ToneOptions } from "../types";
import { clamp, hexToOklch, maxSrgbChroma, normalizeHue, oklchToHexInGamut, paletteTokenOrder, relativeSrgbChroma } from "./oklch";

export function getPaletteMainHue(palette: PalettePreset | PaletteColors): number {
  const colors = "colors" in palette ? palette.colors : palette;
  return Math.round(hexToOklch(colors.accent).h);
}

export function derivePalette(palette: PalettePreset | PaletteColors, tone: ToneOptions = {}): PaletteColors {
  const colors = "colors" in palette ? palette.colors : palette;
  const baseHue = getPaletteMainHue(colors);
  const targetHue = tone.hue == null ? baseHue : normalizeHue(tone.hue);
  const hueShift = normalizeHue(targetHue - baseHue);
  const chromaScale = clamp(tone.chroma ?? 1, 0, 1);
  const lightShift = tone.lightness ?? 0;
  const next = {} as PaletteColors;

  for (const key of paletteTokenOrder) {
    const color = hexToOklch(colors[key]);
    const hue = color.c < 0.006 ? targetHue : color.h + hueShift;
    const light = clamp(color.l + lightShift, 0.04, 0.98);
    const relativeChroma = color.c < 0.006 ? 0 : relativeSrgbChroma(color) * chromaScale;
    next[key] = oklchToHexInGamut({ l: light, c: relativeChroma * maxSrgbChroma(light, hue), h: hue });
  }

  return next;
}
