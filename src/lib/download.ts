import { createPdfDocument } from "@/lib/pdf";
import { toLibraryOptions } from "@/lib/qr-options";
import { PREVIEW_SIZE, type ExportFormat, type QrStyle } from "@/lib/types";

type StyledQr = {
  append(container: HTMLElement): void;
  getRawData(extension: "png" | "svg"): Promise<Blob | Uint8Array | null>;
};

function toBlob(raw: Blob | Uint8Array, type: string): Blob {
  if (raw instanceof Blob) {
    return raw;
  }
  const copy = new Uint8Array(raw.byteLength);
  copy.set(raw);
  return new Blob([copy.buffer], { type });
}

async function createStyledQr(options: Record<string, unknown>): Promise<StyledQr> {
  const imported = await import("qr-code-styling");
  const Qr = imported.default as unknown as new (options: Record<string, unknown>) => StyledQr;
  return new Qr(options);
}

async function renderBlob(
  payload: string,
  style: QrStyle,
  extension: "png" | "svg",
  size: number,
): Promise<Blob> {
  try {
    const qr = await createStyledQr(
      toLibraryOptions(payload, style, size, extension === "svg" ? "svg" : "canvas"),
    );
    const raw = await qr.getRawData(extension);
    if (!raw) {
      throw new Error("empty");
    }
    return toBlob(raw, extension === "svg" ? "image/svg+xml" : "image/png");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/overflow|too long|code length/i.test(message)) {
      throw new Error("This content is too long to fit in a QR code. Nothing was shortened.");
    }
    throw new Error("The file could not be created. Try PNG, or remove the logo and try again.");
  }
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const SHARE_MAX_SIZE = 2048;

export class ShareCancelled extends Error {
  constructor() {
    super("Share cancelled");
    this.name = "ShareCancelled";
  }
}

type ShareData = { files: File[]; title: string };

export type ShareEnv = {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
  copyText?: (text: string) => Promise<void>;
  copyImage?: (file: File) => Promise<void>;
};

function isNamedError(error: unknown, name: string): boolean {
  return error instanceof Error && error.name === name;
}

function defaultShareEnv(): ShareEnv {
  if (typeof navigator === "undefined") {
    return {};
  }
  return {
    share: typeof navigator.share === "function" ? (data) => navigator.share(data) : undefined,
    canShare: typeof navigator.canShare === "function" ? (data) => navigator.canShare(data) : undefined,
    copyText: async (text) => {
      if (!navigator.clipboard?.writeText) {
        throw new Error("clipboard-unavailable");
      }
      await navigator.clipboard.writeText(text);
    },
  };
}

export async function presentSharedFile(
  files: File[],
  title: string,
  env: ShareEnv = defaultShareEnv(),
  text = "",
): Promise<{ method: "shared" | "copied"; file: File }> {
  if (env.share) {
    for (const file of files) {
      const data = { files: [file], title };
      let allowed = false;
      try {
        allowed = env.canShare ? env.canShare(data) : true;
      } catch {
        allowed = false;
      }
      if (!allowed) {
        continue;
      }
      try {
        await env.share(data);
        return { method: "shared", file };
      } catch (error) {
        if (isNamedError(error, "AbortError")) {
          throw new ShareCancelled();
        }
        if (!isNamedError(error, "NotAllowedError")) {
          throw error instanceof Error ? error : new Error("The share menu could not open.");
        }
      }
    }
  }

  const note = text.trim();
  const png = files.find((file) => file.type === "image/png");
  const copiedFile = png ?? files[0];
  if (note && copiedFile && env.copyText) {
    try {
      await env.copyText(note);
      return { method: "copied", file: copiedFile };
    } catch {
      // Text copy is the pasteable fallback. Try the image only if this fails.
    }
  }
  if (png && env.copyImage) {
    try {
      await env.copyImage(png);
      return { method: "copied", file: png };
    } catch {
      // Clipboard image copy is a fallback, not a second failure to report.
    }
  }

  throw new Error("This browser cannot open a share menu. Download the image, then send that file.");
}

async function exportBlob(payload: string, style: QrStyle, format: ExportFormat, caption: string): Promise<Blob> {
  if (format === "pdf") {
    const png = await renderBlob(payload, style, "png", style.exportSize);
    const pdf = await createPdfDocument(new Uint8Array(await png.arrayBuffer()), caption);
    return new Blob([new Uint8Array(pdf)], { type: "application/pdf" });
  }
  return renderBlob(payload, style, format, style.exportSize);
}

export async function downloadQr(options: {
  payload: string;
  style: QrStyle;
  format: ExportFormat;
  filename: string;
  caption: string;
}): Promise<void> {
  const { payload, style, format, filename, caption } = options;
  triggerDownload(await exportBlob(payload, style, format, caption), filename);
}

export async function shareQr(options: {
  payload: string;
  style: QrStyle;
  format: ExportFormat;
  filename: string;
  caption: string;
}): Promise<{ method: "shared" | "copied"; file: File }> {
  const { payload, style, format, filename, caption } = options;
  const files: File[] = [];
  if (format === "png") {
    const png = await renderBlob(payload, style, "png", Math.min(style.exportSize, SHARE_MAX_SIZE));
    files.push(new File([png], filename, { type: "image/png" }));
  } else {
    const primary = await exportBlob(payload, style, format, caption);
    files.push(new File([primary], filename, { type: primary.type }));
    const pngName = filename.replace(/\.[^.]+$/, ".png");
    const png = await renderBlob(payload, style, "png", Math.min(style.exportSize, SHARE_MAX_SIZE));
    files.push(new File([png], pngName, { type: "image/png" }));
  }
  return presentSharedFile(files, caption.trim() || "QR code", undefined, payload);
}

export async function mountPreview(container: HTMLElement, payload: string, style: QrStyle): Promise<void> {
  const qr = await createStyledQr(toLibraryOptions(payload, style, PREVIEW_SIZE, "svg"));
  container.replaceChildren();
  qr.append(container);
}

export async function printQr(payload: string, style: QrStyle): Promise<void> {
  const blob = await renderBlob(payload, style, "png", Math.max(style.exportSize, 1024));
  const url = URL.createObjectURL(blob);
  const sheet = document.getElementById("print-sheet");
  if (!sheet) {
    URL.revokeObjectURL(url);
    throw new Error("Print is unavailable in this browser.");
  }

  sheet.replaceChildren();
  const image = document.createElement("img");
  image.alt = "";
  image.src = url;
  sheet.appendChild(image);
  await image.decode();
  document.body.classList.add("printing");

  const cleanup = () => {
    document.body.classList.remove("printing");
    sheet.replaceChildren();
    URL.revokeObjectURL(url);
  };
  window.addEventListener("afterprint", cleanup, { once: true });
  window.print();
}
