import { getPalette } from "../data/palettes";
import { getShape } from "../data/shapes";
import type { AvatarOptions, AvatarResult, PaletteColors, ShapeId } from "../types";
import { derivePalette } from "../color/tone";
import { toDarkColors } from "../color/dark";
import { clamp } from "../color/oklch";
import { randomFromString } from "./random";

type LayerPalette =
  | { bg: string; blob: string; hot: string; pale: string }
  | { dark: string; base: string; warm: string; cream: string; cool: string }
  | { dark: string; base: string; cream1: string; cream2: string; hot1: string; hot2: string }
  | { base: string; white: string; hot: string; cool: string }
  | { base: string; blue: string; green: string; glow: string }
  | { base: string; milk: string; grad1: string; grad2: string; glow: string };

interface Study {
  type: ShapeId;
  name: string;
  shapeName: string;
  paletteName: string;
  geometryKey: string;
  p: LayerPalette;
}

interface RectOptions {
  rotate?: number;
  fixed?: boolean;
  blur?: string;
  opacity?: number;
  blend?: string;
}

interface Tweak {
  dx: number;
  dy: number;
  sx: number;
  sy: number;
  rotate: number;
  opacity: number;
}

const baseGlows = {
  bloom: { white: "#ffffff", glow1: "#fee9f5", glow2: "#fee9f5" },
  silk: { white: "#ffffff", glow1: "#aec6cf", glow2: "#aec6cf" },
  flare: { white: "#ffffff", glow1: "#ffdfda", glow2: "#ffbe74" },
  nova: { white: "#ffffff", glow1: "#88b9ff", glow2: "#7cb2ff" },
  void: { white: "#ffffff", glow1: "#71abff", glow2: "#71abff" },
  jade: { white: "#ffffff", glow1: "#42cba9", glow2: "#42cba9" },
} as const;

function makeTweaker(seed: string, drift: number): (key: string) => Tweak {
  const v = clamp(drift, 0, 24) / 100;
  return function tweak(key: string): Tweak {
    const r = (suffix: string) => randomFromString(`${seed}:${key}:${suffix}`) * 2 - 1;
    return {
      dx: r("dx") * 2.8 * v,
      dy: r("dy") * 2.8 * v,
      sx: 1 + r("sx") * 0.035 * v,
      sy: 1 + r("sy") * 0.035 * v,
      rotate: r("rot") * 2.8 * v,
      opacity: 1 + r("op") * 0.05 * v,
    };
  };
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function paletteForType(type: ShapeId, palette: PaletteColors): LayerPalette {
  if (type === "bloom") {
    return { bg: palette.base, blob: palette.lobe, hot: palette.accent, pale: palette.pale };
  }
  if (type === "silk") {
    return { dark: palette.dark, base: palette.base, warm: palette.warm, cream: palette.light, cool: palette.cool };
  }
  if (type === "flare") {
    return { dark: palette.dark, base: palette.lobe, cream1: palette.pale, cream2: palette.light, hot1: palette.warm, hot2: palette.accent };
  }
  if (type === "nova") {
    return { base: palette.cool, white: palette.light, hot: palette.accent, cool: palette.beam };
  }
  if (type === "void") {
    return { base: palette.dark, blue: palette.cool, green: palette.beam, glow: palette.accent };
  }
  return { base: palette.lobe, milk: palette.pale, grad1: palette.light, grad2: palette.base, glow: palette.beam };
}

function sharedDefs(): string {
  return `
    <filter id="blur-1" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.1"/></filter>
    <filter id="blur-3" x="-55%" y="-55%" width="210%" height="210%"><feGaussianBlur stdDeviation="3.2"/></filter>
    <filter id="blur-5" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="5.1"/></filter>
    <filter id="blur-6" x="-75%" y="-75%" width="250%" height="250%"><feGaussianBlur stdDeviation="5.7"/></filter>
    <filter id="blur-8" x="-85%" y="-85%" width="270%" height="270%"><feGaussianBlur stdDeviation="8.4"/></filter>
    <filter id="blur-10" x="-95%" y="-95%" width="290%" height="290%"><feGaussianBlur stdDeviation="10.4"/></filter>
    <filter id="blur-14" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="13.8"/></filter>`;
}

function frame(id: string, cx: number, cy: number, size: number): string {
  return `<clipPath id="clip-${id}"><circle cx="${cx}" cy="${cy}" r="${size / 2}"/></clipPath>`;
}

function defsFor(id: string, study: Study): string {
  const p = study.p;
  const gradients: string[] = [];
  if (study.type === "flare" && "cream1" in p) {
    gradients.push(`
      <linearGradient id="cream-${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${p.cream1}"/><stop offset="100%" stop-color="${p.cream2}"/>
      </linearGradient>
      <linearGradient id="hot-${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${p.hot1}"/><stop offset="100%" stop-color="${p.hot2}"/>
      </linearGradient>`);
  }
  if (study.type === "jade" && "grad1" in p) {
    gradients.push(`
      <linearGradient id="jade-${id}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${p.grad1}"/><stop offset="100%" stop-color="${p.grad2}"/>
      </linearGradient>`);
  }
  if (study.type === "bloom" && "hot" in p) {
    gradients.push(`
      <radialGradient id="hot-${id}" cx="102%" cy="50%" r="58%">
        <stop offset="0%" stop-color="${p.hot}" stop-opacity="1"/>
        <stop offset="100%" stop-color="${p.hot}" stop-opacity="0"/>
      </radialGradient>`);
  }
  return gradients.join("");
}

function rect(cx: number, cy: number, w: number, h: number, rx: number, fill: string, options: RectOptions, scale: number, tweak: (key: string) => Tweak, key: string): string {
  const t = options.fixed ? { dx: 0, dy: 0, sx: 1, sy: 1, rotate: 0, opacity: 1 } : tweak(key);
  const x = cx + t.dx * scale;
  const y = cy + t.dy * scale;
  const width = w * t.sx * scale;
  const height = h * t.sy * scale;
  const radius = rx * Math.min(t.sx, t.sy) * scale;
  const rotate = (options.rotate ?? 0) + t.rotate;
  const opacity = clamp((options.opacity ?? 1) * t.opacity, 0.05, 1);
  const filter = options.blur ? ` filter="url(#${options.blur})"` : "";
  const blend = options.blend ? ` style="mix-blend-mode:${options.blend}"` : "";
  return `<g transform="translate(${x.toFixed(3)} ${y.toFixed(3)}) rotate(${rotate.toFixed(3)})"><rect x="${(-width / 2).toFixed(3)}" y="${(-height / 2).toFixed(3)}" width="${width.toFixed(3)}" height="${height.toFixed(3)}" rx="${radius.toFixed(3)}" fill="${fill}" opacity="${opacity.toFixed(3)}"${filter}${blend}/></g>`;
}

function softInset(cx: number, cy: number, w: number, h: number, rx: number, key: keyof typeof baseGlows, options: RectOptions, scale: number): string {
  const glow = baseGlows[key];
  const rotate = options.rotate ?? 0;
  const opacity = options.opacity ?? 0.6;
  const width = w * scale;
  const height = h * scale;
  const radius = rx * scale;
  const inset1 = 1.2 * scale;
  const inset2 = 2 * scale;
  const inset4 = 4 * scale;
  return `
    <g transform="translate(${cx} ${cy}) rotate(${rotate})" opacity="${opacity}">
      <rect x="${(-width / 2 + inset1).toFixed(3)}" y="${(-height / 2 + inset1).toFixed(3)}" width="${(width - inset1 * 2).toFixed(3)}" height="${(height - inset1 * 2).toFixed(3)}" rx="${Math.max(0, radius - inset1).toFixed(3)}" fill="none" stroke="${glow.white}" stroke-width="${(1.4 * scale).toFixed(3)}" opacity="0.38" filter="url(#blur-1)"/>
      <rect x="${(-width / 2 + inset2).toFixed(3)}" y="${(-height / 2 + inset2).toFixed(3)}" width="${(width - inset2 * 2).toFixed(3)}" height="${(height - inset2 * 2).toFixed(3)}" rx="${Math.max(0, radius - inset2).toFixed(3)}" fill="none" stroke="${glow.glow1}" stroke-width="${(2.4 * scale).toFixed(3)}" opacity="0.24" filter="url(#blur-3)"/>
      <rect x="${(-width / 2 + inset4).toFixed(3)}" y="${(-height / 2 + inset4).toFixed(3)}" width="${(width - inset4 * 2).toFixed(3)}" height="${(height - inset4 * 2).toFixed(3)}" rx="${Math.max(0, radius - inset4).toFixed(3)}" fill="none" stroke="${glow.glow2}" stroke-width="${(4 * scale).toFixed(3)}" opacity="0.18" filter="url(#blur-5)"/>
    </g>`;
}

function r(cx: number, cy: number, dx: number, dy: number, w: number, h: number, rx: number, fill: string, options: RectOptions, scale: number, tweak: (key: string) => Tweak, key: string): string {
  return rect(cx + dx * scale, cy + dy * scale, w, h, rx, fill, options, scale, tweak, key);
}

function renderBloom(id: string, p: Extract<LayerPalette, { bg: string }>, cx: number, cy: number, scale: number, tweak: (key: string) => Tweak): string {
  return `
    ${r(cx, cy, 0, 0, 75.25, 75.25, 16.27, p.bg, { rotate: -90, fixed: true }, scale, tweak, "base")}
    ${softInset(cx, cy, 75.25, 75.25, 16.27, "bloom", { rotate: -90, opacity: 0.48 }, scale)}
    ${r(cx, cy, 33.13, 33.19, 91.37, 91.15, 46, p.blob, { rotate: 45, blur: "blur-3", opacity: 0.86 }, scale, tweak, "blob-a")}
    ${r(cx, cy, -33.07, -33.02, 91.37, 91.15, 46, p.blob, { rotate: 45, blur: "blur-3", opacity: 0.86 }, scale, tweak, "blob-b")}
    ${r(cx, cy, 31.16, 31.21, 76.1, 76.53, 38, `url(#hot-${id})`, { rotate: -135, blur: "blur-1", opacity: 0.9 }, scale, tweak, "hot-a")}
    ${r(cx, cy, -31.47, -31.42, 76.53, 76.53, 38, `url(#hot-${id})`, { rotate: 45, blur: "blur-1", opacity: 0.9 }, scale, tweak, "hot-b")}`;
}

function renderSilk(_id: string, p: Extract<LayerPalette, { warm: string }>, cx: number, cy: number, scale: number, tweak: (key: string) => Tweak): string {
  return `
    ${r(cx, cy, 0, 0, 64, 64, 16.25, p.dark, { fixed: true }, scale, tweak, "dark")}
    ${softInset(cx, cy, 64, 64, 16.25, "silk", { opacity: 0.58 }, scale)}
    ${r(cx, cy, 0, 2.29, 70.1, 74.67, 16.25, p.base, { fixed: true }, scale, tweak, "base")}
    ${softInset(cx, cy + 2.29 * scale, 70.1, 74.67, 16.25, "silk", { opacity: 0.42 }, scale)}
    ${r(cx, cy, 0, -25.75, 93.63, 79.59, 50.79, p.warm, { blur: "blur-10", opacity: 0.9 }, scale, tweak, "warm")}
    ${r(cx, cy, 0.03, -13.65, 47.79, 42.71, 50.84, p.cream, { blur: "blur-8", opacity: 0.92 }, scale, tweak, "cream")}`;
}

function renderFlare(id: string, p: Extract<LayerPalette, { cream1: string }>, cx: number, cy: number, scale: number, tweak: (key: string) => Tweak): string {
  return `
    ${r(cx, cy, 0.03, 0.03, 64.06, 64.06, 16.27, p.dark, { fixed: true }, scale, tweak, "dark")}
    ${softInset(cx, cy, 64.06, 64.06, 16.27, "flare", { opacity: 0.42 }, scale)}
    ${r(cx, cy, 0.03, 2.32, 70.17, 74.74, 16.27, p.base, { fixed: true }, scale, tweak, "base")}
    ${softInset(cx, cy + 2.32 * scale, 70.17, 74.74, 16.27, "flare", { opacity: 0.36 }, scale)}
    ${r(cx, cy, 0, -0.5, 70, 65, 120, `url(#cream-${id})`, { blur: "blur-5", opacity: 0.92 }, scale, tweak, "cream")}
    ${r(cx, cy, 7, 10, 44, 44, 120, `url(#hot-${id})`, { blur: "blur-8", opacity: 0.84 }, scale, tweak, "hot")}`;
}

function renderNova(_id: string, p: Extract<LayerPalette, { white: string }>, cx: number, cy: number, scale: number, tweak: (key: string) => Tweak): string {
  return `
    ${r(cx, cy, 0.03, 0.03, 75.25, 75.25, 16.27, p.base, { rotate: -90, fixed: true }, scale, tweak, "base")}
    ${softInset(cx, cy, 75.25, 75.25, 16.27, "nova", { rotate: -90, opacity: 0.42 }, scale)}
    ${r(cx, cy, 0, -17.12, 71.3, 83.65, 33.68, p.white, { rotate: 180, blur: "blur-6", opacity: 0.92 }, scale, tweak, "white")}
    ${r(cx, cy, 0, -28.35, 58.39, 64, 25.26, p.hot, { rotate: 180, blur: "blur-8", opacity: 0.86 }, scale, tweak, "hot")}`;
}

function renderVoid(_id: string, p: Extract<LayerPalette, { blue: string }>, cx: number, cy: number, scale: number, tweak: (key: string) => Tweak): string {
  return `
    ${r(cx, cy, 0, 0, 75.18, 75.18, 16.25, p.base, { rotate: -90, fixed: true }, scale, tweak, "base")}
    ${softInset(cx, cy, 75.18, 75.18, 16.25, "void", { rotate: -90, opacity: 0.36 }, scale)}
    ${r(cx, cy, 0, 0.11, 64, 37.58, 10.16, p.blue, { rotate: 180, blur: "blur-14", opacity: 0.98 }, scale, tweak, "blue")}
    ${r(cx, cy, -0.11, -0.11, 44.89, 18.26, 5.08, p.green, { rotate: 180, blur: "blur-5", opacity: 0.9, blend: "plus-lighter" }, scale, tweak, "green")}`;
}

function renderJade(id: string, p: Extract<LayerPalette, { milk: string }>, cx: number, cy: number, scale: number, tweak: (key: string) => Tweak): string {
  return `
    ${r(cx, cy, 0.03, 0.03, 75.25, 75.25, 16.27, p.base, { rotate: -90, fixed: true }, scale, tweak, "base")}
    ${softInset(cx, cy, 75.25, 75.25, 16.27, "jade", { rotate: -90, opacity: 0.36 }, scale)}
    ${r(cx, cy, 0.03, 28.5, 56.95, 54.91, 10.17, p.milk, { rotate: -90, blur: "blur-14", opacity: 0.9 }, scale, tweak, "milk")}
    ${r(cx, cy, 1, 26, 52, 52, 120, `url(#jade-${id})`, { rotate: -90, blur: "blur-5", opacity: 0.92 }, scale, tweak, "glow")}`;
}

function renderBody(study: Study, id: string, cx: number, cy: number, scale: number, tweak: (key: string) => Tweak): string {
  if (study.type === "bloom") return renderBloom(id, study.p as Extract<LayerPalette, { bg: string }>, cx, cy, scale, tweak);
  if (study.type === "silk") return renderSilk(id, study.p as Extract<LayerPalette, { warm: string }>, cx, cy, scale, tweak);
  if (study.type === "flare") return renderFlare(id, study.p as Extract<LayerPalette, { cream1: string }>, cx, cy, scale, tweak);
  if (study.type === "nova") return renderNova(id, study.p as Extract<LayerPalette, { white: string }>, cx, cy, scale, tweak);
  if (study.type === "void") return renderVoid(id, study.p as Extract<LayerPalette, { blue: string }>, cx, cy, scale, tweak);
  return renderJade(id, study.p as Extract<LayerPalette, { milk: string }>, cx, cy, scale, tweak);
}

function renderSvg(study: Study, options: Required<Pick<AvatarOptions, "variantId" | "drift" | "size">> & Pick<AvatarOptions, "background" | "title">): string {
  const canvasSize = options.size;
  const iconSize = options.size;
  const cx = canvasSize / 2;
  const cy = canvasSize / 2;
  const scale = iconSize / 64;
  const id = "oreo-avatar";
  const tweak = makeTweaker(`${options.variantId}:${study.geometryKey}:${study.type}`, options.drift);
  const body = renderBody(study, id, cx, cy, scale, tweak);
  const title = options.title ? `<title>${escapeHtml(options.title)}</title>` : "";
  const background = options.background === null ? "" : `<rect width="100%" height="100%" fill="${options.background ?? "#ffffff"}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}" role="img">
    ${title}
    <defs>${sharedDefs()}${frame(id, cx, cy, iconSize)}${defsFor(id, study)}</defs>
    ${background}
    <g clip-path="url(#clip-${id})">${body}</g>
  </svg>`;
}

export function createAvatar(options: AvatarOptions = {}): AvatarResult {
  const shape = getShape(options.shape ?? "bloom");
  const palette = getPalette(options.palette);
  const source = options.theme === "dark" ? toDarkColors(palette.colors) : palette.colors;
  const colors = derivePalette(source, options.tone);
  const size = options.size ?? 64;
  const study: Study = {
    type: shape.id,
    name: `${shape.name} / ${palette.name}`,
    shapeName: shape.name,
    paletteName: palette.name,
    geometryKey: shape.name,
    p: paletteForType(shape.id, colors),
  };
  const svg = renderSvg(study, {
    variantId: options.variantId ?? "default",
    drift: options.drift ?? 0,
    size,
    background: options.background,
    title: options.title ?? `${shape.name} avatar`,
  });

  return {
    shape,
    palette,
    colors,
    size,
    svg,
    toSvg: () => svg,
    toDataUri: () => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
  };
}
