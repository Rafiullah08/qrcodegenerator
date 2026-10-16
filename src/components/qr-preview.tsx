"use client";

import { mountPreview } from "@/lib/download";
import { effectiveErrorCorrection, toLibraryOptions } from "@/lib/qr-options";
import { PREVIEW_SIZE, type QrStyle } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

export function QrPreview({ payload, style }: { payload: string; style: QrStyle }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const styleKey = JSON.stringify(toLibraryOptions(payload, style, PREVIEW_SIZE, "svg"));

  useEffect(() => {
    const container = ref.current;
    if (!container) {
      return;
    }
    let cancelled = false;
    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          await mountPreview(container, payload, style);
          if (!cancelled) {
            setError(null);
          }
        } catch {
          if (!cancelled) {
            container.replaceChildren();
            setError("This QR code could not be drawn. Shorten the content and try again.");
          }
        }
      })();
    }, 80);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [payload, style, styleKey]);

  return (
    <div className="w-full max-w-[17.5rem]">
      {error ? (
        <p className="text-center text-sm text-red-700 dark:text-red-400">{error}</p>
      ) : null}
      <div
        ref={ref}
        data-testid="qr-preview"
        role="img"
        aria-label={`QR code, error correction ${effectiveErrorCorrection(style)}`}
        className={error ? "hidden" : "[&_svg]:block [&_svg]:h-auto [&_svg]:w-full"}
      />
    </div>
  );
}
