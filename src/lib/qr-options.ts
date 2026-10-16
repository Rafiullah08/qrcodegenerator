import type { ErrorCorrection, QrStyle } from "@/lib/types";
import { PREVIEW_SIZE } from "@/lib/types";

// qr-code-styling stores each character as a single byte. Passing the UTF-8
// bytes as a binary string keeps accents, emoji, and other languages intact.
export function toQrData(payload: string): string {
  const bytes = new TextEncoder().encode(payload);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return binary;
}

export function effectiveErrorCorrection(style: QrStyle): ErrorCorrection {
  return style.logoDataUrl ? "H" : style.errorCorrection;
}

export function scaledMargin(style: QrStyle, size: number): number {
  return Math.max(0, Math.round(style.margin * (size / PREVIEW_SIZE)));
}

export function toLibraryOptions(
  payload: string,
  style: QrStyle,
  size: number,
  drawType: "svg" | "canvas",
) {
  return {
    width: size,
    height: size,
    type: drawType,
    data: toQrData(payload),
    margin: scaledMargin(style, size),
    image: style.logoDataUrl || undefined,
    qrOptions: {
      errorCorrectionLevel: effectiveErrorCorrection(style),
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.28,
      margin: 8,
      crossOrigin: "anonymous",
    },
    dotsOptions: {
      type: style.dots,
      color: style.foreground,
    },
    cornersSquareOptions: {
      type: style.corners,
      color: style.foreground,
    },
    cornersDotOptions: {
      type: style.cornerDots,
      color: style.foreground,
    },
    backgroundOptions: {
      color: style.background,
    },
  };
}
