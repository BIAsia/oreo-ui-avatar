import type { PaletteColors } from "../types";
import { clamp, hexToOklch, normalizeHue, oklchToHex, paletteTokenOrder } from "./oklch";

/**
 * Blend two hues along the shortest arc of the colour wheel.
 * `t = 0` keeps `a`, `t = 1` returns `b`.
 */
function mixHue(a: number, b: number, t: number): number {
  const delta = ((b - a + 540) % 360) - 180;
  return normalizeHue(a + delta * t);
}

interface DarkToken {
  /** Absolute target lightness. */
  l?: number;
  /** Lightness multiplier (applied to the source lightness). */
  lx?: number;
  /** Lightness clamp range. */
  lmin?: number;
  lmax?: number;
  /** Chroma multiplier. */
  cx?: number;
  /** Chroma clamp range. */
  cmin?: number;
  cmax?: number;
  /** How far to pull the hue toward the accent hue (0 keeps its own hue). */
  hueMix?: number;
}

/**
 * Per-token recipe for the dark treatment. Roles split into three families:
 *
 * - Background / body (`base`, `dark`) drop to a deep, near-black tint. This is
 *   what creates the dark vignette the orb sits in.
 * - Highlight / glow (`pale`, `light`, `warm`, `cool`) stay bright and gain
 *   chroma, pulled strongly toward the accent hue so warm/near-white tokens
 *   read as a luminous wash of the palette's own colour instead of muddy brown.
 * - Vivid accents (`lobe`, `accent`, `beam`) stay luminous, keep their own hue,
 *   and get a chroma boost so they glow like neon against the dark body.
 */
const darkSpec: Record<keyof PaletteColors, DarkToken> = {
  base: { l: 0.2, cx: 1.15, cmin: 0.04, cmax: 0.12, hueMix: 0.45 },
  dark: { lx: 0.7, lmin: 0.08, lmax: 0.17, cx: 1.0, cmin: 0.03, cmax: 0.13, hueMix: 0.4 },
  pale: { lmin: 0.6, lmax: 0.74, cx: 1.5, cmin: 0.05, cmax: 0.16, hueMix: 0.6 },
  light: { lmin: 0.66, lmax: 0.8, cx: 1.8, cmin: 0.06, cmax: 0.18, hueMix: 0.55 },
  warm: { lmin: 0.62, lmax: 0.76, cx: 1.5, cmin: 0.06, cmax: 0.17, hueMix: 0.7 },
  cool: { lmin: 0.55, lmax: 0.72, cx: 1.3, cmin: 0.06, cmax: 0.18, hueMix: 0.35 },
  lobe: { lmin: 0.6, lmax: 0.76, cx: 1.3, cmin: 0.12, cmax: 0.3 },
  accent: { lmin: 0.58, lmax: 0.78, cx: 1.3, cmin: 0.12, cmax: 0.32 },
  beam: { lmin: 0.62, lmax: 0.82, cx: 1.25, cmin: 0.1, cmax: 0.28 },
};

/**
 * Derive the dark-theme variant of a palette. The mapping deepens the fills,
 * keeps the accents luminous, and harmonises near-neutral tokens toward the
 * accent hue so every preset gains a rich, glowing dark counterpart.
 */
export function toDarkColors(palette: PaletteColors): PaletteColors {
  const accentHue = hexToOklch(palette.accent).h;
  const next = {} as PaletteColors;

  for (const key of paletteTokenOrder) {
    const color = hexToOklch(palette[key]);
    const spec = darkSpec[key];
    const ownHue = color.c < 0.02 ? accentHue : color.h;
    const hue = mixHue(ownHue, accentHue, spec.hueMix ?? 0);

    let light = spec.l ?? color.l;
    if (spec.lx != null) light = color.l * spec.lx;
    if (spec.lmin != null) light = clamp(light, spec.lmin, spec.lmax ?? 1);

    const chroma = clamp(color.c * (spec.cx ?? 1), spec.cmin ?? 0, spec.cmax ?? 0.37);
    next[key] = oklchToHex({ l: clamp(light, 0.04, 0.98), c: chroma, h: hue });
  }

  return next;
}
