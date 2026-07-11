import type { PaletteColors, PaletteToken, ShapeId } from "../types";

export interface DarkColorAnchor {
  color: string;
  token: PaletteToken;
}

export interface DarkGlowAnchors {
  narrow: DarkColorAnchor;
  medium: DarkColorAnchor;
  wide: DarkColorAnchor;
}

export interface DarkShapeAnchors {
  lightReference: string;
  layers: Record<string, DarkColorAnchor>;
  frameGlow: DarkGlowAnchors;
  innerGlow?: DarkGlowAnchors;
}

const a = (color: string, token: PaletteToken): DarkColorAnchor => ({ color, token });
const glow = (narrow: DarkColorAnchor, medium: DarkColorAnchor, wide: DarkColorAnchor): DarkGlowAnchors => ({ narrow, medium, wide });

/** Exact color anchors from Oreo UI Standard, node 1303:606. */
export const darkShapeAnchors: Record<ShapeId, DarkShapeAnchors> = {
  nova: {
    lightReference: "aurora-pink",
    layers: {
      base: a("#6550b9", "cool"),
      light: a("#ffffff", "light"),
      hot: a("#ff0084", "accent"),
    },
    frameGlow: glow(a("#ffffff", "light"), a("#0958ca", "cool"), a("#6aa7ff", "cool")),
  },
  void: {
    lightReference: "rose-milk",
    layers: {
      base: a("#031a05", "dark"),
      core: a("#4229ff", "cool"),
      beam: a("#57b565", "beam"),
    },
    frameGlow: glow(a("#000000", "dark"), a("#71abff", "cool"), a("#71abff", "cool")),
  },
  jade: {
    lightReference: "jade-cream",
    layers: {
      base1: a("#031a05", "dark"),
      base2: a("#08b98d", "lobe"),
      milk: a("#0f9a73", "pale"),
      glow1: a("#5fec83", "beam"),
      glow2: a("#ffffff", "light"),
    },
    frameGlow: glow(a("#ffffff", "light"), a("#00c48c", "beam"), a("#5fec83", "beam")),
  },
  bloom: {
    lightReference: "rose-milk",
    layers: {
      base: a("#ff7a7c", "base"),
      blob: a("#df1c77", "lobe"),
      hot: a("#421d11", "accent"),
    },
    frameGlow: glow(a("#e22775", "accent"), a("#ff25a1", "accent"), a("#ffb58e", "warm")),
  },
  silk: {
    lightReference: "rose-milk",
    layers: {
      dark: a("#0047c3", "dark"),
      base: a("#b4a3ff", "base"),
      warm: a("#9086ff", "warm"),
      cream1: a("#1400ae", "light"),
      cream2: a("#6d56ff", "cool"),
    },
    frameGlow: glow(a("#b58aff", "accent"), a("#1a00df", "cool"), a("#4430ff", "cool")),
    innerGlow: glow(a("#ff9de7", "accent"), a("#0047c3", "dark"), a("#0047c3", "dark")),
  },
  flare: {
    lightReference: "peach-cream",
    layers: {
      dark: a("#000000", "dark"),
      base: a("#ff9a44", "lobe"),
      cream1: a("#ff9a44", "pale"),
      cream2: a("#f62b0a", "light"),
      hot1: a("#f62b0a", "warm"),
      hot2: a("#170312", "accent"),
    },
    frameGlow: glow(a("#ffffff", "light"), a("#ff8774", "pale"), a("#ff8c79", "beam")),
    innerGlow: glow(a("#ff9de7", "accent"), a("#ed66cb", "accent"), a("#ed66cb", "accent")),
  },
};

/** Composite dark token set used by the public palette-derivation helper. */
export const darkReferencePalette: PaletteColors = {
  base: "#b1e7ff",
  lobe: "#58e0ff",
  accent: "#ff5ad5",
  pale: "#0e82a3",
  light: "#ffffff",
  warm: "#1e0af6",
  cool: "#6aa7ff",
  dark: "#031a05",
  beam: "#57b565",
};
