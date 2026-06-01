import { DotmSquare3 } from "@/app/components/ui/dotm-square-3";

const DOT_RATIO = 16 / 108;

/**
 * App-wide loading indicator. Wraps the `@dotmatrix/dotm-square-3` loader with
 * the project's standard preset so every spinner — page fallbacks, overlays,
 * and inline button spinners — shares one look. `dotSize` is derived from the
 * 108/16 reference ratio so the same matrix scales cleanly from a large
 * centered loader down to a ~14px button glyph. Reduced-motion is handled
 * internally by `DotmSquare3`.
 */
export function AppLoader({
  size = 108,
  label = "Loading",
  className,
}: {
  size?: number;
  label?: string;
  className?: string;
}) {
  return (
    <DotmSquare3
      size={size}
      dotSize={Math.max(2, Math.round(size * DOT_RATIO))}
      speed={1.31}
      pattern="full"
      colorPreset="solid-theme"
      animated
      opacityBase={0.12}
      opacityMid={0.25}
      opacityPeak={1}
      ariaLabel={label}
      className={className}
    />
  );
}
