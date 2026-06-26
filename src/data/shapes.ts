import type { ShapeId, ShapePreset } from "../types";

export const shapes = [
  {
    id: "bloom",
    name: "Bloom",
    description: "Diagonal paired ribbon with hot radial glows.",
  },
  {
    id: "silk",
    name: "Silk",
    description: "Pearl haze with warm top mass and soft lower tint.",
  },
  {
    id: "flare",
    name: "Flare",
    description: "Warm cream fill with a smaller hot glow.",
  },
  {
    id: "nova",
    name: "Nova",
    description: "Magenta cap, white middle aura, and cool lower field.",
  },
  {
    id: "void",
    name: "Void",
    description: "Dark base with a wide neon core.",
  },
  {
    id: "jade",
    name: "Jade",
    description: "Mint base with a pale lower glow.",
  },
] as const satisfies readonly ShapePreset[];

export function getShape(id: ShapeId = "bloom"): ShapePreset {
  return shapes.find((shape) => shape.id === id) ?? shapes[0];
}
