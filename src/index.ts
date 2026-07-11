export { createAvatar } from "./core/svg";
export { palettes, getPalette } from "./data/palettes";
export { darkReferencePalette } from "./data/dark-appearance";
export { shapes, getShape } from "./data/shapes";
export { derivePalette, getPaletteMainHue } from "./color/tone";
export { deriveAppearanceColor, deriveAppearancePalette } from "./color/appearance";
export { hexToOklch, maxSrgbChroma, oklchToHex, oklchToHexInGamut, relativeSrgbChroma } from "./color/oklch";
export type {
  AvatarAppearance,
  AvatarOptions,
  AvatarResult,
  PaletteColors,
  PalettePreset,
  PaletteToken,
  ShapeId,
  ShapePreset,
  ToneOptions,
} from "./types";
