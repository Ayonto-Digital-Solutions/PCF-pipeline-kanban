export const DEFAULT_ACCENT = "#E1E4EC";
export const ACCENT_INK = "#1B2340";
export const ACCENT_PAPER = "#FFFFFF";
export const HEADER_BASE = "#FFFFFF";
export const HEADER_TINT_ALPHA = 0.18;
export const MINIMUM_CONTRAST = 4.5;

export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

export function parseHexColor(value: string): Rgb | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (match === null) {
    return null;
  }
  const digits = match[1];
  const full =
    digits.length === 3
      ? digits
          .split("")
          .map((digit) => `${digit}${digit}`)
          .join("")
      : digits;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function toHexColor(rgb: Rgb): string {
  const part = (value: number): string => {
    const clamped = Math.min(255, Math.max(0, Math.round(value)));
    return clamped.toString(16).padStart(2, "0");
  };
  return `#${part(rgb.r)}${part(rgb.g)}${part(rgb.b)}`;
}

function channel(value: number): number {
  const scaled = value / 255;
  return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(rgb: Rgb): number {
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

export function contrastRatio(first: string, second: string): number | null {
  const a = parseHexColor(first);
  const b = parseHexColor(second);
  if (a === null || b === null) {
    return null;
  }
  const luminanceA = relativeLuminance(a);
  const luminanceB = relativeLuminance(b);
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
}

export function blend(foreground: Rgb, background: Rgb, alpha: number): Rgb {
  const mix = (a: number, b: number): number => a * alpha + b * (1 - alpha);
  return {
    r: mix(foreground.r, background.r),
    g: mix(foreground.g, background.g),
    b: mix(foreground.b, background.b),
  };
}

export function accentFor(color: string | null): string {
  return color !== null && parseHexColor(color) !== null ? color : DEFAULT_ACCENT;
}

export function headerTintFor(color: string | null): string {
  const accent = parseHexColor(accentFor(color));
  const base = parseHexColor(HEADER_BASE);
  if (accent === null || base === null) {
    return HEADER_BASE;
  }
  return toHexColor(blend(accent, base, HEADER_TINT_ALPHA));
}

export function readableTextOn(background: string): string {
  const withInk = contrastRatio(ACCENT_INK, background);
  const withPaper = contrastRatio(ACCENT_PAPER, background);
  if (withInk === null || withPaper === null) {
    return ACCENT_INK;
  }
  return withPaper > withInk ? ACCENT_PAPER : ACCENT_INK;
}
