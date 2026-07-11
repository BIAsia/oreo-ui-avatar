# @oreo-ui/avatar

Figma-method soft gradient avatar generator.

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
npm install @oreo-ui/avatar
```

## Core Usage

```ts
import { createAvatar } from "@oreo-ui/avatar";

const avatar = createAvatar({
  shape: "bloom",
  palette: "rose-milk",
  tone: {
    hue: 320,
    chroma: 1.05,
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
import { Avatar } from "@oreo-ui/avatar/react";

export function UserAvatar() {
  return (
    <Avatar
      shape="nova"
      palette="aurora-pink"
      tone={{ hue: 280, chroma: 1.1 }}
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
- `chroma`: multiplier, where `1` keeps the preset
- `lightness`: OKLCH lightness delta, where `0` keeps the preset

```ts
import { derivePalette, palettes } from "@oreo-ui/avatar";

const colors = derivePalette(palettes[0], {
  hue: 180,
  chroma: 1.2,
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
| Jade | Mint Milk |

Those reference pairs reproduce the Figma dark color anchors exactly. Other presets preserve the same per-layer relationships by transferring each token's OKLCH deltas from the corresponding light reference.

Chroma transfer is relative to the available sRGB gamut, not an absolute OKLCH `C` ratio. For each color, `Cr = C / Cmax(L, H)`. The derivative scales the dark anchor's `Cr` by `Cr(target) / Cr(reference)`, then resolves the result back to an in-gamut `C` at the derived lightness and hue. This keeps perceived saturation comparable across hues and lightness levels.

Derived colors also have role-based `Cr` floors: `0.42` for dark endpoints, `0.58` for base, `0.68` for pale, and `0.72–0.82` for the chromatic middle roles (`lobe`, `accent`, `warm`, `cool`, and `beam`). Figma reference palettes bypass these floors and remain exact.

Each dark layer transfers the semantic palette direction of the matching light Figma layer. Flare maps its four gradient stops through `pale`, `light`, `warm`, and `accent` in structural order, while its solid base follows `lobe` and its dark endpoint follows `dark`.

Dark derivatives take hue directly from the selected palette token, so one palette keeps the same color identity across all shapes; the Figma anchors provide layer lightness, relative chroma, and effect structure. Dark Flare keeps its softer shape-level input tone (`chroma: 0.45`, `lightness: -0.18`) without rotating hue. Figma reference palettes bypass derivative adjustments and remain exact. The preview's lightness control spans `-0.35` to `0.35`.

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
npx oreo-avatar svg --shape bloom --palette rose-milk --out avatar.svg
npx oreo-avatar svg --shape bloom --palette rose-milk --appearance dark --out avatar-dark.svg
npx oreo-avatar grid --out presets.html
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
npm run verify
npm run dev
```
