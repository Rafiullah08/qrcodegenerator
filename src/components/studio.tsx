"use client";

import { HistoryPanel } from "@/components/history-panel";
import { PreviewPanel } from "@/components/preview-panel";
import { QrForm } from "@/components/qr-form";
import { TypeSelector } from "@/components/type-selector";
import { cardClass } from "@/components/ui";
import { finalizePayload, utf8ByteLength } from "@/lib/capacity";
import { contrastWarning, isHexColor } from "@/lib/contrast";
import { defaultForms, defaultStyle } from "@/lib/defaults";
import { ShareCancelled, downloadQr, printQr, shareQr } from "@/lib/download";
import { buildFilename } from "@/lib/filename";
import {
  HISTORY_KEY,
  parseHistory,
  prepareHistoryEntry,
  restoreForms,
  upsertHistory,
  writeHistory,
} from "@/lib/history";
import { buildPayload } from "@/lib/payloads";
import { effectiveErrorCorrection } from "@/lib/qr-options";
import {
  SENSITIVE_TYPES,
  type ExportFormat,
  type FormsState,
  type HistoryEntry,
  type Notice,
  type QrStyle,
  type QrType,
} from "@/lib/types";
import { Component, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

const HISTORY_EVENT = "qr-studio-history";

function subscribeHistory(onStoreChange: () => void) {
  window.addEventListener(HISTORY_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(HISTORY_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function historySnapshot() {
  try {
    return window.localStorage.getItem(HISTORY_KEY) ?? "";
  } catch {
    return "";
  }
}

function publishHistory() {
  window.dispatchEvent(new Event(HISTORY_EVENT));
}

export function Studio() {
  return (
    <StudioBoundary>
      <StudioApp />
    </StudioBoundary>
  );
}

function StudioApp() {
  const [type, setType] = useState<QrType>("url");
  const [forms, setForms] = useState<FormsState>(defaultForms);
  const [style, setStyle] = useState<QrStyle>(defaultStyle);
  const [label, setLabel] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("png");
  const [banner, setBanner] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [storageMessage, setStorageMessage] = useState<string | null>(null);
  const storedHistory = useSyncExternalStore(subscribeHistory, historySnapshot, () => "");
  const history = useMemo(
    () => (storedHistory ? parseHistory(storedHistory) : []),
    [storedHistory],
  );
  const [sensitiveConfirmed, setSensitiveConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const rawResult = useMemo(() => buildPayload(type, forms[type]), [type, forms]);
  const result = useMemo(
    () => finalizePayload(rawResult, effectiveErrorCorrection(style)),
    [rawResult, style],
  );

  const showFieldErrors = attempted || Object.values(touched).some(Boolean);
  const fieldErrors = result.status === "invalid" && showFieldErrors ? result.fieldErrors : {};
  const colorsValid = isHexColor(style.foreground) && isHexColor(style.background);
  const styleNotices: Notice[] = [];
  if (!colorsValid) {
    styleNotices.push({ tone: "warning", text: "Use 6-digit hex colors, such as #111827." });
  } else {
    const warning = contrastWarning(style.foreground, style.background);
    if (warning) {
      styleNotices.push({ tone: "warning", text: warning });
    }
  }
  if (style.logoDataUrl) {
    styleNotices.push({
      tone: "warning",
      text: "A logo covers the center. Error correction is set to High. Scan a test before you print a batch.",
    });
  }
  if (style.margin < 12) {
    styleNotices.push({
      tone: "warning",
      text: "The quiet zone is very small. Scanners may miss the code, especially in print.",
    });
  }

  const notices = result.status === "ready" ? [...result.notices, ...styleNotices] : styleNotices;
  const payload = result.status === "ready" && colorsValid ? result.payload : null;
  const suggestedName = result.status === "ready" ? result.suggestedName : "";
  const canExport = Boolean(payload);
  const fileLabel = label.trim() || suggestedName || "qr-code";

  function selectType(next: QrType) {
    setType(next);
    setTouched({});
    setAttempted(false);
    setSensitiveConfirmed(false);
    setBanner(null);
    setCopied(false);
    window.requestAnimationFrame(() => headingRef.current?.focus());
  }

  function onFieldChange(field: string, value: string | boolean) {
    setForms((current) => {
      const currentFields = current[type] as Record<string, string | boolean>;
      return {
        ...current,
        [type]: { ...currentFields, [field]: value },
      } as FormsState;
    });
    setTouched((current) => ({ ...current, [field]: true }));
    setCopied(false);
  }

  function shareStatus(result: { method: "shared" | "copied"; file: File }, requested: ExportFormat): string {
    if (result.method === "copied") {
      return "Image copied. Paste it into a chat or email. Nothing was downloaded.";
    }
    if (requested !== "png" && result.file.type === "image/png") {
      return "Shared as a PNG image, which this device can send. Nothing was downloaded.";
    }
    return "The QR file was shared from this device. Nothing was downloaded.";
  }

  async function runShare(
    source: { payload: string; style: QrStyle; type: QrType; name: string },
    surface: "banner" | "history",
  ) {
    setBusy(true);
    if (surface === "banner") {
      setBanner(null);
    }
    try {
      const outcome = await shareQr({
        payload: source.payload,
        style: source.style,
        format,
        filename: buildFilename(source.type, source.name, format),
        caption: source.name,
      });
      const message = shareStatus(outcome, format);
      if (surface === "banner") {
        setBanner(message);
      } else {
        setStorageMessage(message);
      }
    } catch (error) {
      if (error instanceof ShareCancelled) {
        return;
      }
      const message = error instanceof Error ? error.message : "The image could not be shared.";
      if (surface === "banner") {
        setBanner(message);
      } else {
        setStorageMessage(message);
      }
    } finally {
      setBusy(false);
    }
  }

  async function runExport(kind: "download" | "print") {
    setAttempted(true);
    if (result.status !== "ready" || !colorsValid) {
      setBanner("Finish the required fields before exporting.");
      return;
    }
    setBusy(true);
    setBanner(null);
    try {
      if (kind === "print") {
        await printQr(result.payload, style);
      } else {
        await downloadQr({
          payload: result.payload,
          style,
          format,
          filename: buildFilename(type, fileLabel, format),
          caption: fileLabel,
        });
      }
    } catch (error) {
      setBanner(error instanceof Error ? error.message : "The file could not be created.");
    } finally {
      setBusy(false);
    }
  }

  function onSave() {
    setAttempted(true);
    if (result.status !== "ready" || !colorsValid) {
      setBanner("Finish the required fields before saving.");
      return;
    }
    if (SENSITIVE_TYPES.has(type) && !sensitiveConfirmed) {
      return;
    }
    const draft: HistoryEntry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      type,
      name: fileLabel.slice(0, 80),
      payload: result.payload,
      fields: forms[type],
      style,
    };
    const prepared = prepareHistoryEntry(draft);
    const next = upsertHistory(history, prepared.entry);
    const written = writeHistory(window.localStorage, next);
    if (!written.ok) {
      setStorageMessage(written.message);
      return;
    }
    publishHistory();
    setStorageMessage(
      prepared.logoOmitted
        ? "Saved without the logo because it is too large for browser storage."
        : "Saved in this browser.",
    );
    setBanner(null);
  }

  async function onCopy() {
    if (!payload) {
      return;
    }
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setBanner("Encoded content copied.");
    } catch {
      setBanner("Could not copy. Select the encoded content and copy it manually.");
    }
  }

  function onLogo(file: File | null) {
    if (!file) {
      setStyle((current) => ({ ...current, logoDataUrl: null, logoName: null }));
      setLogoError(null);
      return;
    }
    const allowed = new Set(["image/png", "image/jpeg", "image/webp"]);
    if (!allowed.has(file.type)) {
      setLogoError("Use a PNG, JPG, or WebP logo.");
      return;
    }
    if (file.size > 500 * 1024) {
      setLogoError("Choose a logo smaller than 500 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const value = reader.result;
      if (typeof value !== "string" || !value.startsWith("data:image/")) {
        setLogoError("That image could not be read.");
        return;
      }
      setStyle((current) => ({ ...current, logoDataUrl: value, logoName: file.name }));
      setLogoError(null);
    };
    reader.onerror = () => setLogoError("That image could not be read.");
    reader.readAsDataURL(file);
  }

  function openEntry(entry: HistoryEntry) {
    setType(entry.type);
    setForms((current) => restoreForms(current, entry));
    setStyle(entry.style);
    setLabel(entry.name);
    setTouched({});
    setAttempted(false);
    setSensitiveConfirmed(false);
    setBanner(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function downloadEntry(entry: HistoryEntry) {
    setBusy(true);
    try {
      await downloadQr({
        payload: entry.payload,
        style: entry.style,
        format,
        filename: buildFilename(entry.type, entry.name, format),
        caption: entry.name,
      });
      setStorageMessage(null);
    } catch (error) {
      setStorageMessage(error instanceof Error ? error.message : "Could not download that saved code.");
    } finally {
      setBusy(false);
    }
  }

  function deleteEntry(id: string) {
    const next = history.filter((entry) => entry.id !== id);
    const written = writeHistory(window.localStorage, next);
    if (!written.ok) {
      setStorageMessage(written.message);
      return;
    }
    publishHistory();
  }

  function clearHistory() {
    const written = writeHistory(window.localStorage, []);
    if (!written.ok) {
      setStorageMessage(written.message);
      return;
    }
    publishHistory();
    setStorageMessage("History cleared on this browser.");
  }

  const emptyMessage = !colorsValid
    ? "Enter valid colors to draw the code."
    : result.status === "empty"
      ? result.message
      : "Fix the highlighted fields to update the code.";

  return (
    <div className="mx-auto w-full max-w-[90rem] px-3 py-4 sm:px-5 lg:px-6">
      <h1 className="sr-only">QR Studio</h1>
      <p className="sr-only" aria-live="polite">
        {banner ?? (copied ? "Encoded content copied." : "")}
        {payload ? ` ${utf8ByteLength(payload)} bytes ready.` : ""}
      </p>
      {banner ? (
        <p className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100" role="status">
          {banner}
        </p>
      ) : null}
      <div className="grid items-start gap-4 lg:grid-cols-[13.75rem_minmax(0,1fr)_23rem]">
        <div className="lg:sticky lg:top-[4.25rem]">
          <TypeSelector selected={type} onSelect={selectType} />
        </div>
        <section className={`${cardClass} p-5 sm:p-6`}>
          <QrForm
            type={type}
            forms={forms}
            errors={fieldErrors}
            headingRef={headingRef}
            onChange={onFieldChange}
            onBlur={(field) => setTouched((current) => ({ ...current, [field]: true }))}
            onSubmit={() => setAttempted(true)}
          />
        </section>
        <div className="lg:sticky lg:top-[4.25rem] lg:max-h-[calc(100vh-5.25rem)] lg:overflow-y-auto">
          <PreviewPanel
            type={type}
            status={payload ? "ready" : result.status === "ready" ? "invalid" : result.status}
            emptyMessage={emptyMessage}
            formError={result.status === "invalid" ? result.formError : undefined}
            payload={payload}
            notices={notices}
            style={style}
            format={format}
            label={label}
            suggestedName={suggestedName}
            busy={busy}
            sensitiveConfirmed={sensitiveConfirmed}
            canExport={canExport}
            onFormat={setFormat}
            onLabel={setLabel}
            onDownload={() => void runExport("download")}
            onShare={() => {
              setAttempted(true);
              if (result.status !== "ready" || !colorsValid) {
                setBanner("Finish the required fields before sharing.");
                return;
              }
              void runShare({ payload: result.payload, style, type, name: fileLabel }, "banner");
            }}
            onPrint={() => void runExport("print")}
            onCopy={() => void onCopy()}
            onSave={onSave}
            onSensitiveConfirmed={setSensitiveConfirmed}
            onStyle={(patch) => setStyle((current) => ({ ...current, ...patch }))}
            onLogo={onLogo}
            onResetStyle={() => {
              setStyle(defaultStyle());
              setLogoError(null);
            }}
            logoError={logoError}
          />
        </div>
      </div>
      <div className="mt-6">
        <HistoryPanel
          entries={history}
          format={format}
          message={storageMessage}
          busy={busy}
          onOpen={openEntry}
          onDownload={(entry) => void downloadEntry(entry)}
          onShare={(entry) =>
            void runShare({ payload: entry.payload, style: entry.style, type: entry.type, name: entry.name }, "history")
          }
          onDelete={deleteEntry}
          onClear={clearHistory}
        />
      </div>
      <p className="mt-6 text-center text-xs leading-5 text-slate-500">
        Nothing you type is sent to a server. A downloaded image keeps working even if this history is cleared.
      </p>
    </div>
  );
}

class StudioBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <p className="mx-auto max-w-xl px-4 py-16 text-sm leading-6 text-zinc-700">
          Something went wrong while drawing the QR code. Reload the page and try again.
        </p>
      );
    }
    return this.props.children;
  }
}
