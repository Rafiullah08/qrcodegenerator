import { hexColorSchema } from "@/lib/schemas";

export function isHexColor(value: string): boolean {
  return hexColorSchema.safeParse(value).success;
}

export function parseHex(value: string): [number, number, number] | null {
  const match = /^#([0-9a-fA-F]{6})$/.exec(value);
  if (!match) {
    return null;
  }
  const hex = match[1];
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ];
}

function channel(value: number): number {
  const scaled = value / 255;
  return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(rgb: [number, number, number]): number {
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}

export function contrastRatio(foreground: string, background: string): number | null {
  const fg = parseHex(foreground);
  const bg = parseHex(background);
  if (!fg || !bg) {
    return null;
  }
  const lighter = Math.max(relativeLuminance(fg), relativeLuminance(bg));
  const darker = Math.min(relativeLuminance(fg), relativeLuminance(bg));
  return (lighter + 0.05) / (darker + 0.05);
}

export function contrastWarning(foreground: string, background: string): string | null {
  const fg = parseHex(foreground);
  const bg = parseHex(background);
  if (!fg || !bg) {
    return "Use 6-digit hex colors so the code stays readable.";
  }

  const ratio = contrastRatio(foreground, background);
  if (ratio === null) {
    return "Use 6-digit hex colors so the code stays readable.";
  }
  if (relativeLuminance(fg) > relativeLuminance(bg)) {
    return "The modules are lighter than the background. Dark modules on a light background scan more reliably.";
  }
  if (ratio < 2) {
    return "These colors are too similar. Most phones will not be able to scan this code.";
  }
  if (ratio < 4) {
    return "Contrast is low. Print a test and scan it before you rely on this code.";
  }
  return null;
}
