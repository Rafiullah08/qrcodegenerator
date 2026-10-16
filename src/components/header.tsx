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
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
      <a href="#qr-preview" className="skip-link">
        Skip to QR preview
      </a>
      <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-4 px-3 py-3 sm:px-5 lg:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-indigo-600 text-white">
            <QrCode className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-semibold tracking-tight text-slate-900 dark:text-zinc-50">QR Studio</span>
            <span className="hidden truncate text-xs text-slate-500 sm:block dark:text-zinc-400">Static codes, on this device</span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/privacy"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Privacy
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
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
