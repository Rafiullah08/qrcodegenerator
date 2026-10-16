import { JSDOM } from "jsdom";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import QRCodeStyling from "qr-code-styling";
import { describe, expect, it } from "vitest";
import { defaultStyle } from "@/lib/defaults";
import { buildPayload } from "@/lib/payloads";
import { toLibraryOptions } from "@/lib/qr-options";

type Matrix = {
  getModuleCount(): number;
  isDark(row: number, column: number): boolean;
};

function drawMatrix(matrix: Matrix): PNG {
  const count = matrix.getModuleCount();
  const scale = 6;
  const quiet = 4;
  const size = (count + quiet * 2) * scale;
  const png = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const column = Math.floor(x / scale) - quiet;
      const row = Math.floor(y / scale) - quiet;
      const dark = column >= 0 && row >= 0 && column < count && row < count && matrix.isDark(row, column);
      const offset = (y * size + x) * 4;
      const value = dark ? 0 : 255;
      png.data[offset] = value;
      png.data[offset + 1] = value;
      png.data[offset + 2] = value;
      png.data[offset + 3] = 255;
    }
  }
  return png;
}

async function encodeWithLibrary(payload: string): Promise<string | null> {
  const qr = new QRCodeStyling({
    ...toLibraryOptions(payload, defaultStyle(), 480, "svg"),
    jsdom: JSDOM,
  });
  const matrix = (qr as unknown as { _qr?: Matrix })._qr;
  if (!matrix) {
    throw new Error("The QR library did not build a code.");
  }
  const png = drawMatrix(matrix);
  const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height, {
    inversionAttempts: "attemptBoth",
  });
  const svg = await qr.getRawData("svg");
  if (!svg) {
    throw new Error("SVG export was empty.");
  }
  const text = svg instanceof Blob ? await svg.text() : Buffer.from(svg).toString("utf8");
  expect(text).toContain("<svg");
  return decoded?.data ?? null;
}

describe("qr-code-styling output", () => {
  it("encodes the same payload that the form builds, and the SVG export is not empty", async () => {
    const samples = [
      buildPayload("url", { url: "https://example.com/docs?q=qr%20studio#start" }),
      buildPayload("text", { text: "Hello, こんにちは" }),
      buildPayload("wifi", {
        ssid: "Cafe;Net",
        password: "p:ass",
        encryption: "WPA",
        hidden: false,
      }),
    ];

    for (const sample of samples) {
      expect(sample.status).toBe("ready");
      if (sample.status !== "ready") {
        continue;
      }
      expect(await encodeWithLibrary(sample.payload)).toBe(sample.payload);
    }
  }, 20000);
});
