# @oreo-ui/avatar

Figma-method soft gradient avatar generator.

This package renders the 64x64 circular gradient avatars from a stable design grammar:

- 6 shape families: Bloom, Silk, Flare, Nova, Void, Jade
- 40 palette presets
- OKLCH tone controls for global hue, chroma, and lightness shifts
- deterministic, constrained geometry drift through `variantId`
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

## CLI

```bash
npx oreo-avatar svg --shape bloom --palette rose-milk --out avatar.svg
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
