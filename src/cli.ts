#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createAvatar, palettes, shapes } from "./index";
import type { ShapeId } from "./types";
import type { AvatarAppearance } from "./types";

type Args = Record<string, string | boolean>;

function parseArgs(argv: string[]): { command: string; args: Args } {
  const [command = "help", ...rest] = argv;
  const args: Args = {};
  for (let i = 0; i < rest.length; i += 1) {
    const item = rest[i];
    if (!item?.startsWith("--")) continue;
    const key = item.slice(2);
    const next = rest[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return { command, args };
}

function value(args: Args, key: string): string | undefined {
  const raw = args[key];
  return typeof raw === "string" ? raw : undefined;
}

function numberValue(args: Args, key: string): number | undefined {
  const raw = value(args, key);
  if (raw == null) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function writeOutput(path: string, content: string): Promise<void> {
  const output = resolve(path);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, content);
}

function usage(): string {
  return `oreo-avatar

Commands:
  svg   --shape bloom --palette rose-milk --out avatar.svg
  grid  --out presets.html

Options:
  --shape       ${shapes.map((shape) => shape.id).join(", ")}
  --palette     ${palettes.slice(0, 5).map((palette) => palette.id).join(", ")}...
  --hue         OKLCH main hue in degrees
  --chroma      OKLCH chroma multiplier, e.g. 1.1
  --lightness   OKLCH lightness delta, e.g. 0.04
  --appearance  light or dark, default light
  --variant     deterministic geometry id
  --drift       shape drift from 0 to 24
  --size        output size in px, default 64
`;
}

async function main(): Promise<void> {
  const { command, args } = parseArgs(process.argv.slice(2));
  if (command === "help" || args.help) {
    console.log(usage());
    return;
  }

  if (command === "svg") {
    const out = value(args, "out");
    if (!out) throw new Error("Missing --out");
    const avatar = createAvatar({
      shape: (value(args, "shape") as ShapeId | undefined) ?? "bloom",
      palette: value(args, "palette") ?? "rose-milk",
      variantId: value(args, "variant") ?? "cli",
      drift: numberValue(args, "drift") ?? 0,
      size: numberValue(args, "size") ?? 64,
      appearance: (value(args, "appearance") as AvatarAppearance | undefined) ?? "light",
      tone: {
        hue: numberValue(args, "hue"),
        chroma: numberValue(args, "chroma"),
        lightness: numberValue(args, "lightness"),
      },
    });
    await writeOutput(out, avatar.svg);
    return;
  }

  if (command === "grid") {
    const out = value(args, "out");
    if (!out) throw new Error("Missing --out");
    const appearance = (value(args, "appearance") as AvatarAppearance | undefined) ?? "light";
    const items = palettes.flatMap((palette) =>
      shapes.map((shape) => {
        const avatar = createAvatar({ shape: shape.id, palette: palette.id, variantId: "grid", appearance });
        return `<figure>${avatar.svg}<figcaption>${shape.name}<br>${palette.name}</figcaption></figure>`;
      }),
    );
    await writeOutput(
      out,
      `<!doctype html><html><head><meta charset="utf-8"><title>Oreo Avatar Grid</title><style>body{font-family:system-ui;margin:24px;background:${appearance === "dark" ? "#0b0b0d" : "#fafafa"};color:${appearance === "dark" ? "#d7d7dc" : "#333"}}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:16px}figure{margin:0;display:grid;gap:6px;justify-items:center}figcaption{font-size:11px;color:${appearance === "dark" ? "#92929a" : "#6f7685"};text-align:center;line-height:1.2}</style></head><body><div class="grid">${items.join("")}</div></body></html>`,
    );
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
