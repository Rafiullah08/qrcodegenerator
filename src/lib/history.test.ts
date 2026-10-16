import { describe, expect, it } from "vitest";
import { defaultForms, defaultStyle } from "@/lib/defaults";
import {
  parseHistory,
  prepareHistoryEntry,
  readHistory,
  upsertHistory,
  writeHistory,
  type StorageLike,
} from "@/lib/history";
import type { HistoryEntry } from "@/lib/types";

function entry(patch: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: "1",
    createdAt: "2026-10-16T12:00:00.000Z",
    type: "wifi",
    name: "Cafe",
    payload: "WIFI:T:WPA;S:Cafe;P:secret;H:false;;",
    fields: { ...defaultForms().wifi, ssid: "Cafe", password: "secret" },
    style: defaultStyle(),
    ...patch,
  };
}

function memoryStorage(): StorageLike & { data: Record<string, string> } {
  const data: Record<string, string> = {};
  return {
    data,
    getItem(key) {
      return data[key] ?? null;
    },
    setItem(key, value) {
      data[key] = value;
    },
  };
}

describe("local history", () => {
  it("keeps an explicitly saved Wi-Fi payload and ignores corrupt storage", () => {
    const storage = memoryStorage();
    const saved = entry();
    expect(writeHistory(storage, [saved]).ok).toBe(true);
    const loaded = readHistory(storage);
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.payload).toBe(saved.payload);

    storage.setItem("qr-studio-history-v1", "{not json");
    expect(readHistory(storage)).toEqual([]);
    expect(parseHistory(JSON.stringify([{ type: "nope", payload: "x" }]))).toEqual([]);
  });

  it("omits a huge logo and reports a full storage quota", () => {
    const prepared = prepareHistoryEntry(
      entry({
        style: {
          ...defaultStyle(),
          logoDataUrl: `data:image/png;base64,${"a".repeat(130_000)}`,
          logoName: "logo.png",
        },
      }),
    );
    expect(prepared.logoOmitted).toBe(true);
    expect(prepared.entry.style.logoDataUrl).toBeNull();
    expect(prepared.entry.payload).toContain("secret");

    const storage: StorageLike = {
      getItem: () => null,
      setItem() {
        throw new Error("quota");
      },
    };
    const written = writeHistory(storage, [entry()]);
    expect(written.ok).toBe(false);
    if (!written.ok) {
      expect(written.message).toMatch(/storage/i);
    }
  });

  it("replaces a duplicate payload and caps the list", () => {
    const first = entry({ id: "old" });
    const newer = entry({ id: "new", createdAt: "2026-10-16T13:00:00.000Z" });
    const next = upsertHistory([first], newer);
    expect(next).toHaveLength(1);
    expect(next[0]?.id).toBe("new");
  });
});
