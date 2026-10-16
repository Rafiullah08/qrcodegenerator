export const PDF_PAGE_WIDTH = 595.28;
export const PDF_PAGE_HEIGHT = 841.89;
export const PDF_MARGIN = 54;

export function placeQrOnPage(imageWidth: number, imageHeight: number, hasCaption: boolean) {
  const captionBand = hasCaption ? 40 : 0;
  const bottom = PDF_MARGIN + captionBand;
  const maxWidth = PDF_PAGE_WIDTH - PDF_MARGIN * 2;
  const maxHeight = PDF_PAGE_HEIGHT - PDF_MARGIN - bottom;
  const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  const x = (PDF_PAGE_WIDTH - width) / 2;
  const y = bottom + (maxHeight - height) / 2;
  return { x, y, width, height, margin: PDF_MARGIN, captionY: PDF_MARGIN + 14 };
}

function winAnsi(text: string): string {
  return text.replace(/[^\x20-\x7E]/g, "").trim().slice(0, 80);
}

export async function createPdfDocument(pngBytes: Uint8Array, caption: string): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const safeCaption = winAnsi(caption);
  const pdf = await PDFDocument.create();
  pdf.setTitle(safeCaption || "QR Studio");
  pdf.setCreator("QR Studio");
  pdf.setProducer("QR Studio");

  const page = pdf.addPage([PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT]);
  const image = await pdf.embedPng(pngBytes);
  const box = placeQrOnPage(image.width, image.height, Boolean(safeCaption));
  page.drawImage(image, {
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
  });

  if (safeCaption) {
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const textWidth = font.widthOfTextAtSize(safeCaption, 11);
    page.drawText(safeCaption, {
      x: Math.max(PDF_MARGIN, (PDF_PAGE_WIDTH - textWidth) / 2),
      y: box.captionY,
      size: 11,
      font,
      color: rgb(0.25, 0.25, 0.25),
    });
  }

  return pdf.save();
}
