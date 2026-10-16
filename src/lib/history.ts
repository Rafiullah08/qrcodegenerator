import { defaultForms, defaultStyle } from "@/lib/defaults";
import { isHexColor } from "@/lib/contrast";
import {
  CORNER_DOT_STYLES,
  CORNER_STYLES,
  DOT_STYLES,
  EXPORT_SIZES,
  QR_TYPES,
  type ErrorCorrection,
  type FormMap,
  type FormsState,
  type HistoryEntry,
  type QrStyle,
  type QrType,
} from "@/lib/types";

export const HISTORY_KEY = "qr-studio-history-v1";
export const HISTORY_LIMIT = 30;
const MAX_LOGO_CHARS = 120_000;
const MAX_PAYLOAD_CHARS = 8_000;

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

const DOTS = new Set(DOT_STYLES.map((item) => item.value));
const CORNERS = new Set(CORNER_STYLES.map((item) => item.value));
const CORNER_DOTS = new Set(CORNER_DOT_STYLES.map((item) => item.value));
const EC = new Set<ErrorCorrection>(["L", "M", "Q", "H"]);

export function isQrType(value: unknown): value is QrType {
  return typeof value === "string" && (QR_TYPES as readonly string[]).includes(value);
}

function mergeFields(type: QrType, value: unknown): FormMap[QrType] {
  const defaults = defaultForms()[type] as Record<string, string | boolean>;
  const next: Record<string, string | boolean> = { ...defaults };
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(defaults)) {
      const template = defaults[key];
      const current = record[key];
      if (typeof template === "boolean" && typeof current === "boolean") {
        next[key] = current;
      } else if (typeof template === "string" && typeof current === "string") {
        next[key] = current;
      }
    }
  }
  return next as FormMap[QrType];
}

export function sanitizeStyle(value: unknown): QrStyle {
  const base = defaultStyle();
  if (!value || typeof value !== "object") {
    return base;
  }
  const record = value as Record<string, unknown>;
  const dots = typeof record.dots === "string" && DOTS.has(record.dots as QrStyle["dots"]) ? record.dots as QrStyle["dots"] : base.dots;
  const corners = typeof record.corners === "string" && CORNERS.has(record.corners as QrStyle["corners"]) ? record.corners as QrStyle["corners"] : base.corners;
  const cornerDots = typeof record.cornerDots === "string" && CORNER_DOTS.has(record.cornerDots as QrStyle["cornerDots"]) ? record.cornerDots as QrStyle["cornerDots"] : base.cornerDots;
  const errorCorrection = typeof record.errorCorrection === "string" && EC.has(record.errorCorrection as ErrorCorrection) ? record.errorCorrection as ErrorCorrection : base.errorCorrection;
  const exportSize = EXPORT_SIZES.find((size) => size === record.exportSize) ?? base.exportSize;
  const margin = typeof record.margin === "number" && record.margin >= 0 && record.margin <= 64 ? Math.round(record.margin) : base.margin;
  const foreground = typeof record.foreground === "string" && isHexColor(record.foreground) ? record.foreground : base.foreground;
  const background = typeof record.background === "string" && isHexColor(record.background) ? record.background : base.background;
  const logoOk = typeof record.logoDataUrl === "string" && /^data:image\/(png|jpeg|webp);/i.test(record.logoDataUrl) && record.logoDataUrl.length <= MAX_LOGO_CHARS;

  return {
    foreground,
    background,
    dots,
    corners,
    cornerDots,
    margin,
    exportSize,
    errorCorrection,
    logoDataUrl: logoOk ? record.logoDataUrl as string : null,
    logoName: logoOk && typeof record.logoName === "string" ? record.logoName.slice(0, 80) : null,
  };
}

export function parseHistory(raw: string): HistoryEntry[] {
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) {
      return [];
    }
    const entries: HistoryEntry[] = [];
    for (const item of data) {
      if (!item || typeof item !== "object") {
        continue;
      }
      const record = item as Record<string, unknown>;
      if (!isQrType(record.type) || typeof record.payload !== "string") {
        continue;
      }
      if (record.payload.length === 0 || record.payload.length > MAX_PAYLOAD_CHARS) {
        continue;
      }
      entries.push({
        id: typeof record.id === "string" && record.id ? record.id : crypto.randomUUID(),
        createdAt: typeof record.createdAt === "string" ? record.createdAt : new Date(0).toISOString(),
        type: record.type,
        name: typeof record.name === "string" && record.name.trim() ? record.name.trim().slice(0, 80) : "QR code",
        payload: record.payload,
        fields: mergeFields(record.type, record.fields),
        style: sanitizeStyle(record.style),
      });
      if (entries.length >= HISTORY_LIMIT) {
        break;
      }
    }
    return entries;
  } catch {
    return [];
  }
}

export function readHistory(storage: StorageLike): HistoryEntry[] {
  try {
    const raw = storage.getItem(HISTORY_KEY);
    if (!raw) {
      return [];
    }
    return parseHistory(raw);
  } catch {
    return [];
  }
}

export function writeHistory(
  storage: StorageLike,
  entries: HistoryEntry[],
): { ok: true } | { ok: false; message: string } {
  try {
    storage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, HISTORY_LIMIT)));
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "Could not save history. Browser storage may be full or blocked.",
    };
  }
}

export function prepareHistoryEntry(entry: HistoryEntry): { entry: HistoryEntry; logoOmitted: boolean } {
  if (entry.style.logoDataUrl && entry.style.logoDataUrl.length > MAX_LOGO_CHARS) {
    return {
      logoOmitted: true,
      entry: {
        ...entry,
        style: { ...entry.style, logoDataUrl: null, logoName: null },
      },
    };
  }
  return { entry, logoOmitted: false };
}

export function upsertHistory(entries: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  const filtered = entries.filter((item) => !(item.type === entry.type && item.payload === entry.payload));
  return [entry, ...filtered].slice(0, HISTORY_LIMIT);
}

export function formatSavedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Saved earlier";
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function restoreForms(current: FormsState, entry: HistoryEntry): FormsState {
  return { ...current, [entry.type]: entry.fields };
}
