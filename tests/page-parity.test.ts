import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createAvatar, palettes, shapes } from "../src/index";

// index.html carries an inline copy of the core so the page works as a single
// static file, and palette tuning happens there first before being promoted
// into src. This suite fails whenever the two copies drift apart, in either
// direction.

const CORE_START = "/* ===================== ported core";
const CORE_END = "/* ===================== UI";

interface PortedModule {
  createAvatar: typeof createAvatar;
  palettes: typeof palettes;
  shapes: typeof shapes;
}

function loadPortedCore(): PortedModule {
  const html = readFileSync(join(__dirname, "..", "index.html"), "utf8");
  const start = html.indexOf(CORE_START);
  const end = html.indexOf(CORE_END);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("ported core markers not found in index.html");
  }
  const code = html.slice(start, end);
  const factory = new Function(
    "location",
    `${code}\nreturn { createAvatar, palettes, shapes };`,
  ) as (location: { hostname: string }) => PortedModule;
  return factory({ hostname: "parity-check" });
}

// Ignore the two intentional representation differences: def id naming
// (the package namespaces ids per avatar) and whitespace minification.
function normalize(svg: string): string {
  return svg
    .replace(/oreo-[a-z0-9]+/g, "ID")
    .replace(/blur-(\d+)-ID/g, "blur-$1")
    .replace(/>\s+</g, "><")
    .replace(/\s+/g, " ")
    .trim();
}

describe("index.html ported core parity", () => {
  const ported = loadPortedCore();

  it("ships the same shape and palette presets", () => {
    expect(ported.shapes.map((shape) => shape.id)).toEqual(shapes.map((shape) => shape.id));
    expect(ported.palettes.map((palette) => palette.id)).toEqual(palettes.map((palette) => palette.id));
    expect(ported.palettes.map((palette) => palette.colors)).toEqual(palettes.map((palette) => palette.colors));
  });

  it("renders identical avatars for every shape, palette, and appearance", () => {
    const mismatches: string[] = [];
    for (const shape of shapes) {
      for (const palette of palettes) {
        for (const appearance of ["light", "dark"] as const) {
          const options = { shape: shape.id, palette: palette.id, appearance, variantId: "parity", drift: 8 };
          if (normalize(ported.createAvatar(options).svg) !== normalize(createAvatar(options).svg)) {
            mismatches.push(`${shape.id}/${palette.id}/${appearance}`);
          }
        }
      }
    }
    expect(mismatches).toEqual([]);
  });
});
