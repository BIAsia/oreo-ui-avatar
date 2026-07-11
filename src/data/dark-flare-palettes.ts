import type { PaletteColors } from "../types";

export type DarkFlarePaletteOverride = Pick<PaletteColors, "dark" | "lobe" | "pale" | "light" | "warm" | "accent">;

/** Hand-authored Flare palettes for directions that collapse under generic transfer. */
export const darkFlarePaletteOverrides: Partial<Record<string, DarkFlarePaletteOverride>> = {
  "mint-milk": {
    dark: "#021a16",
    lobe: "#36b99b",
    pale: "#83d9bf",
    light: "#b9f0dc",
    warm: "#32a88a",
    accent: "#073e34",
  },
  "blue-cream": {
    dark: "#06152e",
    lobe: "#4a8fd1",
    pale: "#b9dfff",
    light: "#f3df9b",
    warm: "#5c83c7",
    accent: "#102957",
  },
  "lemon-mint": {
    dark: "#08291d",
    lobe: "#70c95e",
    pale: "#c8eb66",
    light: "#efff9b",
    warm: "#d7b83e",
    accent: "#075f4d",
  },
};
