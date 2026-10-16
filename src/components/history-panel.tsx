"use client";

import { cardClass, secondaryButtonClass } from "@/components/ui";
import { formatSavedAt } from "@/lib/history";
import { TYPE_META, type ExportFormat, type HistoryEntry } from "@/lib/types";
import { Download, Share2, Trash2 } from "lucide-react";
import { useState } from "react";

export function HistoryPanel({
  entries,
  format,
  message,
  busy,
  onOpen,
  onDownload,
  onShare,
  onDelete,
  onClear,
}: {
  entries: HistoryEntry[];
  format: ExportFormat;
  message: string | null;
  busy: boolean;
  onOpen: (entry: HistoryEntry) => void;
  onDownload: (entry: HistoryEntry) => void;
  onShare: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}) {
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <section className={`${cardClass} min-w-0 p-4 sm:p-7`} aria-label="Recent QR codes">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-zinc-50">Recent on this browser</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Saved codes stay in local storage on this device. Clearing browser data removes this list. QR images you already downloaded keep working, because the information is stored in the image itself.
          </p>
        </div>
        {entries.length > 0 ? (
          confirmClear ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-300">Remove all saved codes?</span>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => {
                  onClear();
                  setConfirmClear(false);
                }}
              >
                Remove
              </button>
              <button type="button" className={secondaryButtonClass} onClick={() => setConfirmClear(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" className={secondaryButtonClass} onClick={() => setConfirmClear(true)}>
              Clear history
            </button>
          )
        ) : null}
      </div>

      {message ? <p className="mt-3 text-sm text-amber-800 dark:text-amber-200">{message}</p> : null}

      {entries.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-400">
          Nothing is saved yet. Finish a code, then use “Save in this browser”.
        </p>
      ) : (
        <ul className="mt-4 max-h-96 space-y-2 overflow-auto">
          {entries.map((entry) => (
            <li key={entry.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-950/40">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{entry.name}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span className="rounded-full bg-white px-2 py-0.5 font-medium text-slate-700 ring-1 ring-slate-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700">
                    {TYPE_META[entry.type].label}
                  </span>
                  {formatSavedAt(entry.createdAt)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <button type="button" className={secondaryButtonClass} onClick={() => onOpen(entry)} disabled={busy}>
                  Open
                </button>
                <button type="button" className={secondaryButtonClass} onClick={() => onShare(entry)} disabled={busy}>
                  <Share2 className="size-4" aria-hidden="true" />
                  Share
                </button>
                <button type="button" className={secondaryButtonClass} onClick={() => onDownload(entry)} disabled={busy}>
                  <Download className="size-4" aria-hidden="true" />
                  {format.toUpperCase()}
                </button>
                <button type="button" className={secondaryButtonClass} onClick={() => onDelete(entry.id)} disabled={busy} aria-label={`Delete ${entry.name}`}>
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
