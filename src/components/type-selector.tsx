"use client";

import { cx } from "@/components/ui";
import { TYPE_GROUPS, TYPE_META, type QrType } from "@/lib/types";
import {
  ContactRound,
  Landmark,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  PenLine,
  Phone,
  Share2,
  Smartphone,
  Type,
  Wallet,
  Wifi,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<QrType, LucideIcon> = {
  url: Link2,
  text: Type,
  email: Mail,
  phone: Phone,
  sms: MessageSquare,
  wifi: Wifi,
  vcard: ContactRound,
  whatsapp: MessageCircle,
  location: MapPin,
  "payment-link": Wallet,
  "payment-details": Landmark,
  social: Share2,
  app: Smartphone,
  custom: PenLine,
};

export function TypeSelector({
  selected,
  onSelect,
}: {
  selected: QrType;
  onSelect: (type: QrType) => void;
}) {
  return (
    <div className="space-y-6">
      {TYPE_GROUPS.map((group) => (
        <div key={group.id}>
          <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
            {group.label}
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label={group.label}>
            {group.types.map((type) => {
              const Icon = ICONS[type];
              const active = type === selected;
              return (
                <button
                  key={type}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelect(type)}
                  className={cx(
                    "flex min-h-12 items-center gap-2.5 rounded-2xl border px-2.5 py-2 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700",
                    active
                      ? "border-stone-900 bg-stone-900 font-medium text-white shadow-md dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
                      : "border-stone-200/90 bg-stone-50/80 text-stone-700 hover:border-stone-300 hover:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800",
                  )}
                >
                  <span
                    className={cx(
                      "grid size-8 shrink-0 place-items-center rounded-xl",
                      active
                        ? "bg-white/15 text-white dark:bg-stone-900/10 dark:text-stone-950"
                        : "bg-white text-stone-600 shadow-sm dark:bg-zinc-900 dark:text-zinc-300",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="leading-tight">{TYPE_META[type].label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
