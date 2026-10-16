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
import { useState, type ReactNode } from "react";

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
      <div className="qr-stage relative px-4 py-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Preview</h2>
          <span
            className={cx(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
              status === "ready"
                ? "bg-white text-indigo-700 shadow-sm dark:bg-zinc-900 dark:text-indigo-200"
                : "bg-white/80 text-slate-500 dark:bg-zinc-900 dark:text-zinc-300",
            )}
          >
            {status === "ready" ? "Ready" : status === "invalid" ? "Check fields" : "Waiting"}
          </span>
        </div>
        <div
          className="mx-auto flex min-h-[280px] w-fit min-w-[240px] items-center justify-center rounded-2xl border border-white bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)] dark:border-zinc-700 dark:bg-zinc-950"
          style={status === "ready" ? { backgroundColor: background } : undefined}
          data-qr-status={status}
        >
          {status === "ready" && payload ? (
            <QrPreview payload={payload} style={style} />
          ) : (
            <div className="max-w-[14rem] px-2 py-8 text-center">
              <span className="mx-auto grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-400">
                <QrCode className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-zinc-400">
                {formError ?? emptyMessage}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 border-t border-slate-100 px-4 py-4 dark:border-zinc-800">
      <p className="text-xs leading-5 text-slate-500 dark:text-zinc-400">
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

      <div className="grid grid-cols-3 rounded-lg bg-slate-100 p-1 dark:bg-zinc-950" role="group" aria-label="Format">
        {(["png", "svg", "pdf"] as const).map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={format === item}
            onClick={() => onFormat(item)}
            className={cx(
              "rounded-md py-1.5 text-xs font-semibold uppercase tracking-wide focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              format === item
                ? "bg-white text-slate-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                : "text-slate-500 hover:text-slate-800 dark:text-zinc-400",
            )}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextLabel label="File name">
          <input
            className={inputClass}
            value={label}
            onChange={(event) => onLabel(event.target.value)}
            placeholder={suggestedName || "qr-studio"}
            aria-describedby="filename-hint"
          />
        </TextLabel>
        <SelectControl
          id="export-size"
          label="Resolution"
          value={String(style.exportSize)}
          onChange={(value) => onStyle({ exportSize: Number(value) as QrStyle["exportSize"] })}
        >
          {EXPORT_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}px{size === 2048 ? " · print" : ""}
            </option>
          ))}
        </SelectControl>
      </div>
      <p id="filename-hint" className="text-xs leading-5 text-slate-500">
        The name is used for the file and saved history. Passwords are not added unless you type them here.
      </p>
      <button
        type="button"
        className={`${primaryButtonClass} w-full py-3`}
        onClick={onDownload}
        disabled={!canExport || busy}
        data-testid="download-button"
      >
        <Download className="size-4" aria-hidden="true" />
        {busy ? "Preparing…" : `Download ${format.toUpperCase()}`}
      </button>
      <div className="grid grid-cols-3 gap-2">
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
          Save
        </button>
      </div>
      {sensitive ? (
        <label className="flex items-start gap-3 text-sm text-slate-700 dark:text-zinc-300">
          <input
            type="checkbox"
            className="mt-0.5 size-4 rounded border-slate-300"
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
      <p className="text-xs leading-5 text-slate-500">
        Share sends the image from this device without a download. If the share menu is unavailable, the image is copied so you can paste it.
      </p>

      {payload ? (
        <details className="rounded-lg border border-slate-200 dark:border-zinc-700">
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-slate-700 dark:text-zinc-200">
            Encoded content · {bytes} bytes
          </summary>
          <div className="border-t border-slate-200 px-3 py-2 dark:border-zinc-700">
            <div className="mb-2 flex justify-end">
              <button type="button" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-300" onClick={onCopy}>
                <Copy className="size-3.5" aria-hidden="true" />
                Copy
              </button>
            </div>
            <pre
              data-testid="encoded-payload"
              className="max-h-36 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-slate-950 px-3 py-2 font-mono text-xs leading-5 text-slate-100"
            >
              {payload}
            </pre>
          </div>
        </details>
      ) : null}
      </div>

      <Customize style={style} onStyle={onStyle} onLogo={onLogo} onResetStyle={onResetStyle} logoError={logoError} />
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
  const [tab, setTab] = useState<"colors" | "shapes" | "logo">("colors");
  const logoLocked = Boolean(style.logoDataUrl);
  const tabs = [
    { id: "colors", label: "Colors" },
    { id: "shapes", label: "Shapes" },
    { id: "logo", label: "Logo" },
  ] as const;

  return (
    <div className="border-t border-slate-100 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <div className="flex gap-1" role="tablist" aria-label="Design">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={cx(
                "rounded-md px-2.5 py-1.5 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                tab === item.id
                  ? "bg-slate-100 text-slate-900 dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-slate-500 hover:text-slate-800 dark:text-zinc-400",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button type="button" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white" onClick={onResetStyle}>
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Reset
        </button>
      </div>

      <div className="space-y-4 px-4 py-4">
        {tab === "colors" ? (
          <>
            <div className="flex flex-wrap gap-2" aria-label="Color presets">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
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
              <ColorField id="foreground" label="Foreground" value={style.foreground} onChange={(value) => onStyle({ foreground: value })} />
              <ColorField id="background" label="Background" value={style.background} onChange={(value) => onStyle({ background: value })} />
            </div>
          </>
        ) : null}

        {tab === "shapes" ? (
          <>
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
                <span className="text-xs text-slate-500">{style.margin}px on screen</span>
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
                className="w-full accent-indigo-600"
              />
              <span id="margin-hint" className="block text-xs leading-5 text-slate-500">
                Empty space around the code. Keep some so scanners can find the edges. It scales with the export size.
              </span>
            </label>
          </>
        ) : null}

        {tab === "logo" ? (
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
            <p className="text-xs leading-5 text-slate-500">
              PNG, JPG, or WebP, up to 500 KB. A logo covers part of the code, so error correction switches to High.
              {style.logoName ? ` Current file: ${style.logoName}.` : ""}
            </p>
            {logoError ? <p className="text-sm text-red-700 dark:text-red-400">{logoError}</p> : null}
          </div>
        ) : null}
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
          className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1 dark:border-zinc-700"
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
