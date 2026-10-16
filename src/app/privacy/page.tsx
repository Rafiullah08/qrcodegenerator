import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How QR Studio handles the information you type.",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-800 dark:text-teal-300">QR Studio</p>
      <h1 className="mt-2 font-display text-4xl text-stone-900 dark:text-stone-50">Privacy</h1>
      <div className="mt-6 space-y-4 rounded-3xl border border-white/80 bg-white/90 p-6 text-sm leading-7 text-zinc-700 shadow-[0_18px_50px_rgba(28,25,23,0.06)] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
        <p>
          QR Studio creates QR codes on your device. The text, links, contact details, Wi-Fi passwords, and payment information you enter are not uploaded to a QR service, and this app has no account and no database.
        </p>
        <p>
          A saved history, if you choose to keep one, is stored in this browser only. It can include a Wi-Fi password or payment details when you explicitly save those codes. Clearing the site’s browser data removes that history. Images you already downloaded still work, because a static QR code keeps its data inside the picture.
        </p>
        <p>
          The QR image itself does not expire and does not point at a short link created by this app. If the code contains a website, payment page, app store listing, or other online service, that destination can still be changed or removed by whoever operates it.
        </p>
        <p>
          Scanning a payment code does not send money. It only shows the URL or payment details you encoded, and your bank or wallet decides what to do next. QR Studio never asks for a card security code, bank password, or secret key.
        </p>
        <p>
          <Link href="/" className="font-medium text-teal-800 underline-offset-2 hover:underline dark:text-teal-300">
            Back to QR Studio
          </Link>
        </p>
      </div>
    </article>
  );
}
