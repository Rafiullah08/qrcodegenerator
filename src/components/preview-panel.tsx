"use client";

import { QrPreview } from "@/components/qr-preview";
import {
  cardClass,
  cx,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import { isHexColor } from "@/lib/contrast";
import { utf8ByteLength } from "@/lib/capacity";
import { effectiveErrorCorrection } from "@/lib/qr-options";
import {
  COLOR_PRESETS,
  CORNER_DOT_STYLES,
  CORNER_STYLES,
  DOT_STYLES,
  ERROR_CORRECTION_OPTIONS,
  EXPORT_SIZES,
  SENSITIVE_TYPES,
  type ExportFormat,
  type Notice,
  type QrStyle,
  type QrType,
} from "@/lib/types";
import { Copy, Download, ImagePlus, Printer, QrCode, RotateCcw, Save, Share2 } from "lucide-react";
import type { ReactNode } from "react";

export function PreviewPanel({
  type,
  status,
  emptyMessage,
  formError,
  payload,
  notices,
  style,
  format,
  label,
  suggestedName,
  busy,
  sensitiveConfirmed,
  canExport,
  onFormat,
  onLabel,
  onDownload,
  onShare,
  onPrint,
  onCopy,
  onSave,
  onSensitiveConfirmed,
  onStyle,
  onLogo,
  onResetStyle,
  logoError,
}: {
  type: QrType;
  status: "empty" | "invalid" | "ready";
  emptyMessage: string;
  formError?: string;
  payload: string | null;
  notices: Notice[];
  style: QrStyle;
  format: ExportFormat;
  label: string;
  suggestedName: string;
  busy: boolean;
  sensitiveConfirmed: boolean;
  canExport: boolean;
  onFormat: (format: ExportFormat) => void;
  onLabel: (value: string) => void;
  onDownload: () => void;
  onShare: () => void;
  onPrint: () => void;
  onCopy: () => void;
  onSave: () => void;
  onSensitiveConfirmed: (value: boolean) => void;
  onStyle: (patch: Partial<QrStyle>) => void;
  onLogo: (file: File | null) => void;
  onResetStyle: () => void;
  logoError: string | null;
}) {
  const background = isHexColor(style.background) ? style.background : "#ffffff";
  const sensitive = SENSITIVE_TYPES.has(type);
  const bytes = payload ? utf8ByteLength(payload) : 0;

  return (
    <section id="qr-preview" className={`${cardClass} overflow-hidden`} aria-label="QR preview">
      <div className="border-b border-stone-100 px-5 py-4 sm:px-6 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">02 — Preview</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-stone-900 dark:text-zinc-50">Live proof</h2>
          </div>
          <span
            className={cx(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
              status === "ready"
                ? "bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200"
                : "bg-stone-100 text-stone-500 dark:bg-zinc-800 dark:text-zinc-300",
            )}
          >
            {status === "ready" ? "Static" : status === "invalid" ? "Check fields" : "Waiting"}
          </span>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6">
      <div className="rounded-[1.4rem] bg-stone-900 p-2.5 shadow-[0_20px_40px_rgba(28,25,23,0.18)] dark:bg-black">
      <div
        className={cx(
          "flex min-h-[300px] items-center justify-center rounded-[1.1rem] p-6",
          status === "ready" ? "" : "bg-[radial-gradient(circle_at_center,#ffffff,#eceae4)] dark:bg-zinc-950",
        )}
        style={status === "ready" ? { backgroundColor: background } : undefined}
        data-qr-status={status}
      >
        {status === "ready" && payload ? (
          <QrPreview payload={payload} style={style} />
        ) : (
          <div className="max-w-xs text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-stone-500 shadow-sm dark:bg-zinc-900 dark:text-zinc-300">
              <QrCode className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm leading-6 text-stone-500 dark:text-zinc-400">
              {formError ?? emptyMessage}
            </p>
          </div>
        )}
      </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-stone-500 dark:text-zinc-400">
        The image stores this data directly. It does not expire. A website or payment page inside it can still go offline later.
      </p>

      {status === "ready" ? (
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          Error correction: {ERROR_CORRECTION_OPTIONS.find((item) => item.value === effectiveErrorCorrection(style))?.label}
          {style.logoDataUrl ? " · raised because a logo is set" : ""}
        </p>
      ) : null}

      {formError && status !== "empty" ? (
        <p className="mt-3 text-sm text-red-700 dark:text-red-400" role="alert">
          {formError}
        </p>
      ) : null}

      {notices.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {notices.map((notice) => (
            <li
              key={notice.text}
              className={cx(
                "rounded-xl px-3 py-2 text-sm leading-6",
                notice.tone === "warning"
                  ? "bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100"
                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
              )}
            >
              {notice.text}
            </li>
          ))}
        </ul>
      ) : null}

      {payload ? (
        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium">Encoded content</h3>
            <button type="button" className="inline-flex items-center gap-1 text-sm font-medium text-teal-800 dark:text-teal-300" onClick={onCopy}>
              <Copy className="size-3.5" aria-hidden="true" />
              Copy
            </button>
          </div>
          <pre
            data-testid="encoded-payload"
            className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap break-all rounded-2xl bg-stone-950 px-3 py-2.5 font-mono text-xs leading-5 text-stone-100"
          >
            {payload}
          </pre>
          <p className="mt-1 text-xs text-zinc-500">{bytes} bytes stored in the image</p>
        </div>
      ) : null}

      <Customize style={style} onStyle={onStyle} onLogo={onLogo} onResetStyle={onResetStyle} logoError={logoError} />

      <div className="mt-6 space-y-3 border-t border-stone-100 pt-5 dark:border-zinc-800">
        <TextLabel label="File name">
          <input
            className={inputClass}
            value={label}
            onChange={(event) => onLabel(event.target.value)}
            placeholder={suggestedName || "qr-studio"}
            aria-describedby="filename-hint"
          />
        </TextLabel>
        <p id="filename-hint" className="text-xs text-zinc-500">
          Used for the download, the shared file, and saved history. Passwords and account numbers are not added unless you type them here.
        </p>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="block space-y-1.5">
            <span className={labelClass}>Format</span>
            <select
              className={inputClass}
              value={format}
              onChange={(event) => onFormat(event.target.value as ExportFormat)}
            >
              <option value="png">PNG</option>
              <option value="svg">SVG</option>
              <option value="pdf">PDF</option>
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="button"
              className={`${primaryButtonClass} w-full sm:w-auto`}
              onClick={onDownload}
              disabled={!canExport || busy}
              data-testid="download-button"
            >
              <Download className="size-4" aria-hidden="true" />
              {busy ? "Preparing…" : "Download"}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={onShare}
            disabled={!canExport || busy}
            data-testid="share-button"
          >
            <Share2 className="size-4" aria-hidden="true" />
            Share
          </button>
          <button type="button" className={secondaryButtonClass} onClick={onPrint} disabled={!canExport || busy}>
            <Printer className="size-4" aria-hidden="true" />
            Print
          </button>
          <button type="button" className={secondaryButtonClass} onClick={onSave} disabled={!canExport || (sensitive && !sensitiveConfirmed)}>
            <Save className="size-4" aria-hidden="true" />
            Save in this browser
          </button>
        </div>
        {sensitive ? (
          <label className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              className="mt-0.5 size-4 rounded border-zinc-300"
              checked={sensitiveConfirmed}
              onChange={(event) => onSensitiveConfirmed(event.target.checked)}
            />
            <span>
              {type === "wifi"
                ? "Saving stores the Wi-Fi password in this browser. It is not uploaded."
                : "Saving stores these payment details in this browser. It is not uploaded."}
            </span>
          </label>
        ) : null}
        <p className="text-xs leading-5 text-zinc-500">
          Share opens the menu on this device, so you can send the image without downloading it. If that menu is unavailable, the image is copied for pasting into a chat.
        </p>
      </div>
      </div>
    </section>
  );
}

function TextLabel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function Customize({
  style,
  onStyle,
  onLogo,
  onResetStyle,
  logoError,
}: {
  style: QrStyle;
  onStyle: (patch: Partial<QrStyle>) => void;
  onLogo: (file: File | null) => void;
  onResetStyle: () => void;
  logoError: string | null;
}) {
  const logoLocked = Boolean(style.logoDataUrl);
  return (
    <div className="mt-6 space-y-4 rounded-2xl border border-stone-100 bg-stone-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Appearance</h3>
        <button type="button" className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white" onClick={onResetStyle}>
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Reset appearance
        </button>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Color presets">
        {COLOR_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 shadow-sm hover:border-stone-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            onClick={() => onStyle({ foreground: preset.foreground, background: preset.background })}
          >
            <span
              className="size-3.5 rounded-full border border-black/10"
              style={{ background: `linear-gradient(135deg, ${preset.foreground} 50%, ${preset.background} 50%)` }}
              aria-hidden="true"
            />
            {preset.name}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ColorField
          id="foreground"
          label="Foreground"
          value={style.foreground}
          onChange={(value) => onStyle({ foreground: value })}
        />
        <ColorField
          id="background"
          label="Background"
          value={style.background}
          onChange={(value) => onStyle({ background: value })}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SelectControl id="dots" label="Dot style" value={style.dots} onChange={(value) => onStyle({ dots: value as QrStyle["dots"] })}>
          {DOT_STYLES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </SelectControl>
        <SelectControl id="corners" label="Corner style" value={style.corners} onChange={(value) => onStyle({ corners: value as QrStyle["corners"] })}>
          {CORNER_STYLES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </SelectControl>
        <SelectControl id="corner-dots" label="Corner center" value={style.cornerDots} onChange={(value) => onStyle({ cornerDots: value as QrStyle["cornerDots"] })}>
          {CORNER_DOT_STYLES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </SelectControl>
        <SelectControl
          id="ec"
          label="Error correction"
          value={logoLocked ? "H" : style.errorCorrection}
          disabled={logoLocked}
          onChange={(value) => onStyle({ errorCorrection: value as QrStyle["errorCorrection"] })}
        >
          {ERROR_CORRECTION_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </SelectControl>
      </div>

      <label className="block space-y-1.5">
        <span className="flex items-baseline justify-between">
          <span className={labelClass}>Quiet zone</span>
          <span className="text-xs text-zinc-500">{style.margin}px on screen</span>
        </span>
        <input
          type="range"
          min={0}
          max={48}
          step={1}
          value={style.margin}
          aria-valuemin={0}
          aria-valuemax={48}
          aria-valuenow={style.margin}
          aria-describedby="margin-hint"
          onChange={(event) => onStyle({ margin: Number(event.target.value) })}
          className="w-full accent-teal-800"
        />
        <span id="margin-hint" className="block text-xs leading-5 text-zinc-500">
          Empty space around the code. Keep some so scanners can find the edges. It scales with the export size.
        </span>
      </label>

      <SelectControl
        id="export-size"
        label="Export resolution"
        value={String(style.exportSize)}
        onChange={(value) => onStyle({ exportSize: Number(value) as QrStyle["exportSize"] })}
      >
        {EXPORT_SIZES.map((size) => (
          <option key={size} value={size}>
            {size} × {size}px{size === 2048 ? " · recommended for print" : ""}
          </option>
        ))}
      </SelectControl>

      <div className="space-y-2">
        <span className={labelClass}>Center logo</span>
        <div className="flex flex-wrap items-center gap-2">
          <label className={`${secondaryButtonClass} cursor-pointer`}>
            <ImagePlus className="size-4" aria-hidden="true" />
            Choose image
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                onLogo(file);
                event.target.value = "";
              }}
            />
          </label>
          {style.logoDataUrl ? (
            <button type="button" className={secondaryButtonClass} onClick={() => onLogo(null)}>
              Remove logo
            </button>
          ) : null}
        </div>
        <p className="text-xs leading-5 text-zinc-500">
          PNG, JPG, or WebP, up to 500 KB. A logo covers part of the code, so error correction switches to High.
          {style.logoName ? ` Current file: ${style.logoName}.` : ""}
        </p>
        {logoError ? <p className="text-sm text-red-700 dark:text-red-400">{logoError}</p> : null}
      </div>
    </div>
  );
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const picker = isHexColor(value) ? value : "#111827";
  return (
    <label className="block space-y-1.5">
      <span className={labelClass}>{label}</span>
      <span className="flex gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={picker}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-12 cursor-pointer rounded-lg border border-zinc-300 bg-white p-1 dark:border-zinc-700"
        />
        <input
          id={id}
          className={inputClass}
          value={value}
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => {
            const trimmed = value.trim();
            if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
              onChange(`#${trimmed.toLowerCase()}`);
            } else if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
              onChange(trimmed.toLowerCase());
            }
          }}
        />
      </span>
    </label>
  );
}

function SelectControl({
  id,
  label,
  value,
  onChange,
  children,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className="block space-y-1.5" htmlFor={id}>
      <span className={labelClass}>{label}</span>
      <select id={id} className={inputClass} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}
