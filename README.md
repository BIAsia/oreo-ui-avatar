# @oreo-design/avatar

[![npm](https://img.shields.io/npm/v/%40oreo-design%2Favatar)](https://www.npmjs.com/package/@oreo-design/avatar)
[![CI](https://github.com/BIAsia/oreo-design-avatar/actions/workflows/ci.yml/badge.svg)](https://github.com/BIAsia/oreo-design-avatar/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

Figma-method soft gradient avatar generator.

**[Try the live playground →](https://oreo-design-avatar.vercel.app)**

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/BIAsia/oreo-design-avatar/main/assets/preview-dark.svg">
  <img alt="Oreo Avatar previews: 6 shape families across 8 palette presets" src="https://raw.githubusercontent.com/BIAsia/oreo-design-avatar/main/assets/preview-light.svg" width="620">
</picture>

This package renders the 64x64 circular gradient avatars from a stable design grammar:

- 6 shape families: Bloom, Silk, Flare, Nova, Void, Jade
- 40 palette presets
- OKLCH tone controls for global hue, chroma, and lightness shifts
- Figma-authored dark anchors with OKLCH palette derivatives
- deterministic, constrained geometry drift through `variantId`
- fixed 64×64 internal geometry; `size` scales the complete SVG uniformly
- SVG output with no runtime dependencies
- optional React component

## Install

```bash
npm install @oreo-design/avatar
```

## Core Usage

```ts
import { createAvatar } from "@oreo-design/avatar";

const avatar = createAvatar({
  shape: "bloom",
  palette: "rose-milk",
  tone: {
    hue: 320,
    chroma: 0.9,
    lightness: 0,
  },
  appearance: "dark",
  variantId: "user-123",
  drift: 8,
  size: 64,
});

document.body.innerHTML = avatar.svg;
```

## React

```tsx
import { Avatar } from "@oreo-design/avatar/react";

export function UserAvatar() {
  return (
    <Avatar
      shape="nova"
      palette="aurora-pink"
      tone={{ hue: 280, chroma: 0.9 }}
      variantId="user-123"
      drift={8}
      size={64}
    />
  );
}
```

## Palette Tone Model

Palette presets are not edited color-by-color. Pick a preset first, then shift the whole palette:

- `hue`: absolute OKLCH main hue in degrees
- `chroma`: relative chroma scale from `0` to `1`, where `1` keeps each token's preset `Cr` and `0` removes chroma
- `lightness`: OKLCH lightness delta, where `0` keeps the preset

```ts
import { derivePalette, palettes } from "@oreo-design/avatar";

const colors = derivePalette(palettes[0], {
  hue: 180,
  chroma: 0.8,
  lightness: 0.04,
});
```

## Dark Appearance

Dark mode uses a separate Figma-authored color grammar and light reference for each shape:

| Shape | Light reference |
| --- | --- |
| Bloom | Rose Milk |
| Silk | Rose Milk |
| Flare | Peach Cream |
| Nova | Aurora Pink |
| Void | Rose Milk |
| Jade | Jade Cream |

Those reference pairs reproduce the Figma dark color anchors exactly. Other presets preserve the same per-layer relationships by transferring each token's OKLCH deltas from the corresponding light reference.

Chroma transfer is relative to the available sRGB gamut, not an absolute OKLCH `C` ratio. For each color, `Cr = C / Cmax(L, H)`. Dark derivation transfers 86% of the selected light token's OKLCH difference onto its matching dark anchor: `Ld = Lanchor + 0.86 × (Ltarget - Lreference)` and `Crd = Cranchor + 0.86 × (Crtarget - Crreference)`. The result is resolved back to an in-gamut `C` at the target token hue, preserving light-palette contrast without copying absolute chroma.

Every derived chromatic role currently uses a `Cr` floor of `1`. The tone chroma scale applies to these floors too, so every painted dark color still responds continuously down to `0`. Reference palettes bypass derivative adjustments and remain exact.

Each dark layer transfers the semantic palette direction of the matching light Figma layer. Flare maps its four gradient stops through `pale`, `light`, `warm`, and `accent` in structural order, while its solid base follows `lobe` and its dark endpoint follows `dark`.

Flare derives every painted layer directly from the matching Light Flare layer. The Peach Cream light/dark pair supplies only that layer's OKLCH lightness and relative-chroma adjustment; the selected light color's hue is preserved exactly. Frame and inner glow derivation remain independent.

All 40 built-in Flare directions use explicit, hand-authored six-layer Dark palettes. Tone controls are applied on top of those presets, while effects continue to use the shared Flare effect system. The generic transfer remains available only as a fallback for custom palettes.

Dark derivatives take hue directly from the selected palette token, so one palette keeps the same color identity across all shapes; the dark anchors provide layer lightness, relative chroma, and effect structure. Flare adds a shape-level `lightness: -0.04` adjustment and Bloom adds `lightness: -0.10`; both preserve full relative chroma by default. Reference palettes bypass derivative adjustments and remain exact. The preview's lightness control spans `-0.35` to `0.35`.

```ts
const avatar = createAvatar({
  shape: "flare",
  palette: "sunset-punch",
  appearance: "dark",
  background: null,
});
```

The transform is deterministic. Shape geometry and layer placement stay fixed; Silk, Flare, and Jade use the gradient fill modes defined by the Figma dark masters.

## CLI

```bash
npx @oreo-design/avatar svg --shape bloom --palette rose-milk --out avatar.svg
npx @oreo-design/avatar svg --shape bloom --palette rose-milk --appearance dark --out avatar-dark.svg
npx @oreo-design/avatar grid --out presets.html
```

## Design Constraints

- The avatar is always a circular clipping mask.
- No rim, no stroke, no bevel, no shadow.
- All visible color is created by clipped inner rounded rectangles.
- Blur is applied to inner shapes only.
- `drift` is intentionally small and cannot create a new shape grammar.

## Development

```bash
npm install
npm run verify          # typecheck + tests + build + entry smoke checks
npm run dev             # local playground
npm run preview:assets  # regenerate the README preview SVGs (build first)
```

Releases are automated: bump `version`, update `CHANGELOG.md`, then push a `v*` tag — see `.github/workflows/release.yml`.

## License

[MIT](./LICENSE) — part of the [Oreo UI](https://github.com/BIAsia/oreo-ui) family.
