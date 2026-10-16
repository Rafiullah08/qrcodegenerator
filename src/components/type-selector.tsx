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

function TypeButton({
  type,
  active,
  onSelect,
  compact,
}: {
  type: QrType;
  active: boolean;
  onSelect: (type: QrType) => void;
  compact?: boolean;
}) {
  const Icon = ICONS[type];
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onSelect(type)}
      className={cx(
        "flex items-center gap-2 rounded-lg text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
        compact ? "shrink-0 px-2.5 py-2" : "w-full px-2 py-1.5",
        active
          ? "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-200"
          : "text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
      )}
    >
      <span
        className={cx(
          "grid size-7 shrink-0 place-items-center rounded-md",
          active
            ? "bg-indigo-600 text-white"
            : "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-300",
        )}
      >
        <Icon className="size-3.5" aria-hidden="true" />
      </span>
      <span className="whitespace-nowrap">{TYPE_META[type].label}</span>
    </button>
  );
}

export function TypeSelector({
  selected,
  onSelect,
}: {
  selected: QrType;
  onSelect: (type: QrType) => void;
}) {
  const types = TYPE_GROUPS.flatMap((group) => group.types);

  return (
    <nav aria-label="QR code type" className="rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-zinc-800 dark:bg-zinc-900 lg:p-3">
      <div className="flex gap-1 overflow-x-auto lg:hidden">
        {types.map((type) => (
          <TypeButton key={type} type={type} active={type === selected} onSelect={onSelect} compact />
        ))}
      </div>
      <div className="hidden space-y-4 lg:block">
        {TYPE_GROUPS.map((group) => (
          <div key={group.id}>
            <h2 className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              {group.label}
            </h2>
            <div role="group" aria-label={group.label} className="space-y-0.5">
              {group.types.map((type) => (
                <TypeButton key={type} type={type} active={type === selected} onSelect={onSelect} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
