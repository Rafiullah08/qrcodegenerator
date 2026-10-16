import type { BuildResult, ErrorCorrection, Notice } from "@/lib/types";

export const QR_BYTE_CAPACITY: Record<ErrorCorrection, number> = {
  L: 2953,
  M: 2331,
  Q: 1663,
  H: 1273,
};

export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function finalizePayload(result: BuildResult, errorCorrection: ErrorCorrection): BuildResult {
  if (result.status !== "ready") {
    return result;
  }

  const bytes = utf8ByteLength(result.payload);
  const limit = QR_BYTE_CAPACITY[errorCorrection];
  if (bytes > limit) {
    return {
      status: "invalid",
      fieldErrors: {},
      formError: `This content is ${bytes} bytes. At ${errorCorrection} error correction, a QR code holds about ${limit} bytes. Nothing was shortened. Shorten the content, or choose a lower error-correction level if you are not using a logo.`,
    };
  }

  if (bytes <= 900) {
    return result;
  }

  const density: Notice = {
    tone: "warning",
    text: `This code is dense (${bytes} bytes). Print it large, and scan a test copy before you rely on it.`,
  };
  return { ...result, notices: [...result.notices, density] };
}
