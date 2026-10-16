"use client";

import { Moon, QrCode, Sun } from "lucide-react";
import Link from "next/link";

function toggleTheme() {
  const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
  document.documentElement.classList.toggle("dark", next === "dark");
  try {
    localStorage.setItem("qr-studio-theme", next);
  } catch {
    // The theme still applies for this visit if storage is blocked.
  }
}

export function Header() {

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#f6f3ec]/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <a href="#qr-preview" className="skip-link">
        Skip to QR preview
      </a>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-stone-900 text-white shadow-sm dark:bg-white dark:text-stone-900">
            <QrCode className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-2xl leading-none tracking-tight text-stone-900 dark:text-stone-50">QR Studio</span>
            <span className="mt-1 block truncate text-xs font-medium uppercase tracking-[0.16em] text-stone-500 dark:text-zinc-400">
              Static · Private · On this device
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/privacy"
            className="rounded-full px-3 py-2 text-sm font-medium text-stone-700 hover:bg-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Privacy
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex size-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-sm hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            aria-label="Toggle color theme"
          >
            <Sun className="hidden size-4 dark:block" />
            <Moon className="size-4 dark:hidden" />
          </button>
        </div>
      </div>
    </header>
  );
}
