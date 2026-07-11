import type { PaletteColors } from "../types";

export interface OklchColor {
  l: number;
  c: number;
  h: number;
}

export const paletteTokenOrder = [
  "base",
  "lobe",
  "accent",
  "pale",
  "light",
  "warm",
  "cool",
  "dark",
  "beam",
] as const satisfies readonly (keyof PaletteColors)[];

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360;
}

function srgbToLinear(value: number): number {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(value: number): number {
  const clamped = clamp(value, 0, 1);
  return clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * (clamped ** (1 / 2.4)) - 0.055;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16) / 255,
    g: Number.parseInt(normalized.slice(2, 4), 16) / 255,
    b: Number.parseInt(normalized.slice(4, 6), 16) / 255,
  };
}

function rgbToHex(rgb: { r: number; g: number; b: number }): string {
  const part = (value: number) => Math.round(clamp(value, 0, 1) * 255).toString(16).padStart(2, "0");
  return `#${part(rgb.r)}${part(rgb.g)}${part(rgb.b)}`;
}

function oklchToLinearRgb(oklch: OklchColor): { r: number; g: number; b: number } {
  const h = (normalizeHue(oklch.h) * Math.PI) / 180;
  const a = Math.cos(h) * oklch.c;
  const b = Math.sin(h) * oklch.c;
  const lRoot = oklch.l + 0.3963377774 * a + 0.2158037573 * b;
  const mRoot = oklch.l - 0.1055613458 * a - 0.0638541728 * b;
  const sRoot = oklch.l - 0.0894841775 * a - 1.291485548 * b;
  const l = lRoot ** 3;
  const m = mRoot ** 3;
  const s = sRoot ** 3;
  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

function isInSrgbGamut(oklch: OklchColor): boolean {
  const epsilon = 0.000001;
  return Object.values(oklchToLinearRgb(oklch)).every((channel) => channel >= -epsilon && channel <= 1 + epsilon);
}

/** Maximum in-gamut OKLCH chroma for an sRGB lightness/hue coordinate. */
export function maxSrgbChroma(lightness: number, hue: number): number {
  const l = clamp(lightness, 0, 1);
  if (l <= 0.000001 || l >= 0.999999) return 0;

  let low = 0;
  let high = 0.4;
  while (high < 1 && isInSrgbGamut({ l, c: high, h: hue })) high *= 2;
  for (let pass = 0; pass < 24; pass += 1) {
    const chroma = (low + high) / 2;
    if (isInSrgbGamut({ l, c: chroma, h: hue })) low = chroma;
    else high = chroma;
  }
  return low;
}

/** Chroma normalized to the available sRGB gamut at the same lightness/hue. */
export function relativeSrgbChroma(oklch: OklchColor): number {
  if (oklch.c < 0.0001) return 0;
  const maximum = maxSrgbChroma(oklch.l, oklch.h);
  return maximum < 0.0001 ? 0 : clamp(oklch.c / maximum, 0, 1);
}

export function hexToOklch(hex: string): OklchColor {
  const rgb = hexToRgb(hex);
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);
  const okL = 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot;
  const okA = 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot;
  const okB = 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot;
  const c = Math.sqrt(okA * okA + okB * okB);
  const h = c < 0.0001 ? 0 : normalizeHue((Math.atan2(okB, okA) * 180) / Math.PI);
  return { l: okL, c, h };
}

export function oklchToHex(oklch: OklchColor): string {
  const rgb = oklchToLinearRgb(oklch);
  return rgbToHex({ r: linearToSrgb(rgb.r), g: linearToSrgb(rgb.g), b: linearToSrgb(rgb.b) });
}

/**
 * Maps OKLCH to sRGB by reducing chroma while keeping lightness and hue fixed.
 * This avoids the hue shifts caused by clipping individual RGB channels.
 */
export function oklchToHexInGamut(oklch: OklchColor): string {
  if (isInSrgbGamut(oklch)) return oklchToHex(oklch);

  let low = 0;
  let high = Math.max(0, oklch.c);
  for (let pass = 0; pass < 24; pass += 1) {
    const chroma = (low + high) / 2;
    if (isInSrgbGamut({ ...oklch, c: chroma })) low = chroma;
    else high = chroma;
  }
  return oklchToHex({ ...oklch, c: low });
}
