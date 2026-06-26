import * as React from "react";
import { createAvatar } from "./core/svg";
import type { AvatarOptions } from "./types";

export interface AvatarProps extends AvatarOptions {
  className?: string;
  style?: React.CSSProperties;
}

export function Avatar({ className, style, ...options }: AvatarProps): React.ReactElement {
  const avatar = React.useMemo(() => createAvatar(options), [JSON.stringify(options)]);
  return (
    <span
      className={className}
      style={{ display: "inline-block", width: avatar.size, height: avatar.size, lineHeight: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: avatar.svg }}
    />
  );
}
