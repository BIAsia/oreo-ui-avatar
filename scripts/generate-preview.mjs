// Regenerates the README preview images. Run `npm run build` first, then
// `npm run preview:assets`. Output goes to assets/ (not shipped to npm).
import { mkdir, writeFile } from "node:fs/promises";
import { createAvatar, shapes } from "../dist/index.js";

const PALETTES = [
  "rose-milk",
  "peach-cream",
  "mint-milk",
  "aurora-pink",
  "lilac-silk",
  "blue-cream",
  "amber-dusk",
  "magenta-void",
];

const TILE = 64;
const GAP = 10;

function grid(appearance) {
  const cols = PALETTES.length;
  const rows = shapes.length;
  const width = cols * TILE + (cols - 1) * GAP;
  const height = rows * TILE + (rows - 1) * GAP;
  const tiles = shapes.flatMap((shape, row) =>
    PALETTES.map((palette, col) => {
      const avatar = createAvatar({ shape: shape.id, palette, appearance, variantId: "preview", drift: 8 });
      const x = col * (TILE + GAP);
      const y = row * (TILE + GAP);
      return `<svg x="${x}" y="${y}" width="${TILE}" height="${TILE}" viewBox="0 0 ${TILE} ${TILE}">${avatar.svg}</svg>`;
    }),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${tiles.join("")}</svg>`;
}

await mkdir(new URL("../assets/", import.meta.url), { recursive: true });
for (const appearance of ["light", "dark"]) {
  const file = new URL(`../assets/preview-${appearance}.svg`, import.meta.url);
  await writeFile(file, grid(appearance));
  console.log(`wrote ${file.pathname}`);
}
