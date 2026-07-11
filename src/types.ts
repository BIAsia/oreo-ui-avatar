export type ShapeId = "bloom" | "silk" | "flare" | "nova" | "void" | "jade";

export type AvatarAppearance = "light" | "dark";

export type PaletteToken =
  | "base"
  | "lobe"
  | "accent"
  | "pale"
  | "light"
  | "warm"
  | "cool"
  | "dark"
  | "beam";

export type PaletteColors = Record<PaletteToken, string>;

export interface ShapePreset {
  id: ShapeId;
  name: string;
  description: string;
}

export interface PalettePreset {
  id: string;
  name: string;
  colors: PaletteColors;
}

export interface ToneOptions {
  /**
   * Absolute main hue in OKLCH degrees. When omitted, the palette accent hue is used.
   */
  hue?: number;
  /**
   * Chroma multiplier. 1 keeps the preset chroma, 0.8 softens, 1.2 intensifies.
   */
  chroma?: number;
  /**
   * OKLCH lightness delta. 0 keeps the preset, 0.08 brightens, -0.08 darkens.
   */
  lightness?: number;
}

export interface AvatarOptions {
  shape?: ShapeId;
  palette?: string | PalettePreset | PaletteColors;
  tone?: ToneOptions;
  /**
   * Palette appearance. Dark mode starts from the Figma dark anchors for
   * each shape, then applies the selected palette's OKLCH token deltas.
   */
  appearance?: AvatarAppearance;
  variantId?: string;
  drift?: number;
  size?: number;
  background?: string | null;
  title?: string;
}

export interface AvatarResult {
  shape: ShapePreset;
  palette: PalettePreset;
  colors: PaletteColors;
  /** Nine fixed paint/effect slots used by this shape in both appearances. */
  usedColors: readonly string[];
  appearance: AvatarAppearance;
  size: number;
  svg: string;
  toSvg(): string;
  toDataUri(): string;
}
