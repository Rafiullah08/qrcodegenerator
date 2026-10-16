import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import { defaultStyle } from "@/lib/defaults";
import { buildFilename } from "@/lib/filename";
import { createPdfDocument, PDF_MARGIN, PDF_PAGE_HEIGHT, PDF_PAGE_WIDTH, placeQrOnPage } from "@/lib/pdf";
import { toLibraryOptions } from "@/lib/qr-options";

describe("filenames", () => {
  it("builds a readable name and drops characters that are not safe in a file name", () => {
    expect(buildFilename("payment-details", "Ada Lovelace", "png")).toBe(
      "qr-studio-payment-details-ada-lovelace.png",
    );
    expect(buildFilename("wifi", "Cafe Wi-Fi", "svg")).toBe("qr-studio-wifi-cafe-wi-fi.svg");
    expect(buildFilename("text", "東京", "png")).toBe("qr-studio-text.png");
  });
});

describe("export options", () => {
  it("passes the payload and colors through, and raises error correction for a logo", () => {
    const style = defaultStyle();
    const options = toLibraryOptions("https://example.com/a?b=1#c", style, 2048, "canvas");
    expect(options.data).toBe("https://example.com/a?b=1#c");
    expect(options.dotsOptions.color).toBe("#111827");
    expect(options.backgroundOptions.color).toBe("#ffffff");
    expect(options.qrOptions.errorCorrectionLevel).toBe("M");
    expect(options.margin).toBeGreaterThan(0);
    expect(options.image).toBeUndefined();

    const withLogo = toLibraryOptions("https://example.com", {
      ...style,
      errorCorrection: "L",
      logoDataUrl: "data:image/png;base64,aaaa",
    }, 280, "svg");
    expect(withLogo.qrOptions.errorCorrectionLevel).toBe("H");
    expect(withLogo.image).toBe("data:image/png;base64,aaaa");
  });
});

describe("print layout and PDF", () => {
  it("keeps the QR inside the page margins", () => {
    const box = placeQrOnPage(2048, 2048, true);
    expect(box.x).toBeGreaterThanOrEqual(PDF_MARGIN);
    expect(box.y).toBeGreaterThanOrEqual(PDF_MARGIN);
    expect(box.x + box.width).toBeLessThanOrEqual(PDF_PAGE_WIDTH - PDF_MARGIN + 0.01);
    expect(box.y + box.height).toBeLessThanOrEqual(PDF_PAGE_HEIGHT - PDF_MARGIN + 0.01);
  });

  it("creates a PDF from a PNG", async () => {
    const png = new PNG({ width: 8, height: 8 });
    for (let index = 0; index < png.data.length; index += 4) {
      png.data[index] = 17;
      png.data[index + 1] = 24;
      png.data[index + 2] = 39;
      png.data[index + 3] = 255;
    }
    const bytes = await createPdfDocument(new Uint8Array(PNG.sync.write(png)), "Café Wi-Fi");
    expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe("%PDF-");
    expect(bytes.byteLength).toBeGreaterThan(100);
  });
});
