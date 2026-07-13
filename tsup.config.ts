import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts", react: "src/react.tsx" },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    // Share the core between the two entries instead of inlining a full copy
    // of createAvatar into react.js. Applies to the ESM output; the CJS
    // fallback stays self-contained.
    splitting: true,
  },
  {
    // The bin only ever runs as ESM on node >= 20; no CJS or d.ts needed.
    entry: { cli: "src/cli.ts" },
    format: ["esm"],
    clean: false,
  },
]);
