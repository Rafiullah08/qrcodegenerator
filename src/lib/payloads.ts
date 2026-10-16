import { buildMailto, buildSms, buildVCard, buildWhatsApp, buildWifiPayload, optionalWebsite, readEmail, wifiFieldErrors } from "@/lib/contacts";
import { suggestClip } from "@/lib/filename";
import { normalizePhone, whatsAppNumber } from "@/lib/phone";
import { buildBitcoinPayload, buildSepaPayload, buildUpiPayload } from "@/lib/payment";
import type { BuildResult, FormMap, Notice, QrType } from "@/lib/types";
import { readHttpUrl, siteName } from "@/lib/url";
import { z } from "zod";

const PAYMENT_SCAN_NOTE: Notice = {
  tone: "warning",
  text: "Scanning this code does not send money. A bank or wallet app may offer to start a payment from the stored details. QR Studio does not process the payment.",
};

const MAPS_NOTE: Notice = {
  tone: "warning",
  text: "This QR code stores a Google Maps link. The image does not expire, but it depends on Google Maps remaining available.",
};

const GEO_NOTE: Notice = {
  tone: "info",
  text: "This uses a geo: location. Map apps can open it without a website in the middle.",
};

const STORE_NOTE: Notice = {
  tone: "info",
  text: "The QR image does not expire. The store listing or download can still be removed later.",
};

function empty(message: string): BuildResult {
  return { status: "empty", message };
}

function invalid(fieldErrors: Record<string, string>, formError?: string): BuildResult {
  return { status: "invalid", fieldErrors, formError };
}

function ready(payload: string, suggestedName: string, notices: Notice[] = []): BuildResult {
  return { status: "ready", payload, suggestedName: suggestedName || "QR code", notices };
}

function blankText(value: string): boolean {
  return value.trim().length === 0;
}

function parseCoordinate(
  value: string,
  min: number,
  max: number,
  label: string,
): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, error: `Enter a ${label}.` };
  }
  if (!/^[+-]?(?:\d+|\d+\.\d+)$/.test(trimmed)) {
    return { ok: false, error: `Enter a decimal ${label}.` };
  }
  const number = Number(trimmed);
  if (!Number.isFinite(number) || number < min || number > max) {
    return { ok: false, error: `The ${label} must be between ${min} and ${max}.` };
  }
  return { ok: true, value: trimmed };
}

const SOCIAL_PROFILES: Record<Exclude<FormMap["social"]["platform"], "custom">, (username: string) => string> = {
  instagram: (username) => `https://instagram.com/${username}`,
  x: (username) => `https://x.com/${username}`,
  facebook: (username) => `https://www.facebook.com/${username}`,
  linkedin: (username) => `https://www.linkedin.com/in/${username}`,
  youtube: (username) => `https://www.youtube.com/@${username}`,
  tiktok: (username) => `https://www.tiktok.com/@${username}`,
  github: (username) => `https://github.com/${username}`,
  telegram: (username) => `https://t.me/${username}`,
};

function buildUrl(fields: FormMap["url"]): BuildResult {
  if (blankText(fields.url)) {
    return empty("Enter a website URL to generate a QR code.");
  }
  const url = readHttpUrl(fields.url);
  if (!url.ok) {
    return invalid({ url: url.error });
  }
  return ready(url.url, siteName(url.url));
}

function buildText(fields: FormMap["text"]): BuildResult {
  if (blankText(fields.text)) {
    return empty("Enter the text to encode.");
  }
  return ready(fields.text, suggestClip(fields.text) || "Text");
}

function buildEmail(fields: FormMap["email"]): BuildResult {
  if (blankText(fields.email) && blankText(fields.subject) && blankText(fields.body)) {
    return empty("Enter an email address.");
  }
  const email = readEmail(fields.email);
  if (!email.ok) {
    return invalid({ email: email.error });
  }
  return ready(
    buildMailto(email.email, fields.subject.trim(), fields.body),
    email.email,
  );
}

function buildPhone(fields: FormMap["phone"]): BuildResult {
  if (blankText(fields.phone)) {
    return empty("Enter a phone number.");
  }
  const phone = normalizePhone(fields.phone);
  if (!phone.ok) {
    return invalid({ phone: phone.error });
  }
  return ready(`tel:${phone.phone}`, "Phone");
}

function buildSmsPayload(fields: FormMap["sms"]): BuildResult {
  if (blankText(fields.phone) && blankText(fields.message)) {
    return empty("Enter a phone number.");
  }
  const phone = normalizePhone(fields.phone);
  if (!phone.ok) {
    return invalid({ phone: phone.error });
  }
  return ready(buildSms(phone.phone, fields.message), "SMS");
}

function buildWifi(fields: FormMap["wifi"]): BuildResult {
  const encryption = z.enum(["WPA", "WEP", "nopass"]).safeParse(fields.encryption);
  if (!encryption.success) {
    return invalid({ encryption: "Choose an encryption type." });
  }
  if (
    blankText(fields.ssid) &&
    fields.password.length === 0 &&
    !fields.hidden &&
    encryption.data === "WPA"
  ) {
    return empty("Enter a network name.");
  }

  const fieldErrors = wifiFieldErrors({
    ssid: fields.ssid,
    password: fields.password,
    encryption: encryption.data,
  });
  if (Object.keys(fieldErrors).length > 0) {
    return invalid(fieldErrors);
  }

  const notices: Notice[] = [
    {
      tone: "warning",
      text: "The network password is stored inside the QR image. Anyone who scans or saves the image can read it.",
    },
  ];
  if (encryption.data === "WPA" && fields.password.length > 0 && fields.password.length < 8) {
    notices.push({
      tone: "info",
      text: "Most WPA networks use a password of at least 8 characters. The code still contains exactly what you entered.",
    });
  }

  return ready(
    buildWifiPayload(fields.ssid, fields.password, encryption.data, fields.hidden),
    suggestClip(fields.ssid) || "Wi-Fi",
    notices,
  );
}

function buildVCardPayload(fields: FormMap["vcard"]): BuildResult {
  const values = Object.values(fields);
  if (values.every((value) => value.trim() === "")) {
    return empty("Enter a name, organization, phone number, or email.");
  }

  const fieldErrors: Record<string, string> = {};
  const phone = fields.phone.trim() ? normalizePhone(fields.phone) : { ok: true as const, phone: "" };
  if (!phone.ok) {
    fieldErrors.phone = phone.error;
  }
  const email = fields.email.trim() ? readEmail(fields.email) : { ok: true as const, email: "" };
  if (!email.ok) {
    fieldErrors.email = email.error;
  }
  const website = optionalWebsite(fields.website);
  if (!website.ok) {
    fieldErrors.website = website.error;
  }
  if (Object.keys(fieldErrors).length > 0 || !phone.ok || !email.ok || !website.ok) {
    return invalid(fieldErrors);
  }

  const named = fields.firstName.trim() || fields.lastName.trim();
  if (!named && !fields.organization.trim() && !phone.phone && !email.email) {
    return invalid({}, "Add a name, organization, phone number, or email. A title or address alone is not a contact.");
  }

  const fullName = [fields.firstName.trim(), fields.lastName.trim()].filter(Boolean).join(" ");
  return ready(
    buildVCard({
      ...fields,
      phone: phone.phone,
      email: email.email,
      website: website.url,
    }),
    suggestClip(fullName || fields.organization) || "Contact",
  );
}

function buildWhatsapp(fields: FormMap["whatsapp"]): BuildResult {
  if (blankText(fields.phone) && blankText(fields.message)) {
    return empty("Enter a WhatsApp phone number.");
  }
  const phone = whatsAppNumber(fields.phone);
  if (!phone.ok) {
    return invalid({ phone: phone.error });
  }
  return ready(buildWhatsApp(phone.digits, fields.message), "WhatsApp");
}

function buildLocation(fields: FormMap["location"]): BuildResult {
  const mode = z.enum(["coordinates", "address", "url"]).safeParse(fields.mode);
  if (!mode.success) {
    return invalid({ mode: "Choose a location format." });
  }

  if (mode.data === "coordinates") {
    if (blankText(fields.latitude) && blankText(fields.longitude)) {
      return empty("Enter a latitude and longitude.");
    }
    const latitude = parseCoordinate(fields.latitude, -90, 90, "latitude");
    const longitude = parseCoordinate(fields.longitude, -180, 180, "longitude");
    const fieldErrors: Record<string, string> = {};
    if (!latitude.ok) {
      fieldErrors.latitude = latitude.error;
    }
    if (!longitude.ok) {
      fieldErrors.longitude = longitude.error;
    }
    if (!latitude.ok || !longitude.ok) {
      return invalid(fieldErrors);
    }
    const linkStyle = fields.linkStyle === "google" ? "google" : "geo";
    if (linkStyle === "google") {
      const query = `${latitude.value},${longitude.value}`;
      return ready(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
        "Google Maps",
        [MAPS_NOTE],
      );
    }
    return ready(`geo:${latitude.value},${longitude.value}`, "Location", [GEO_NOTE]);
  }

  if (mode.data === "address") {
    const address = fields.address.trim();
    if (!address) {
      return empty("Enter an address or place name.");
    }
    if (address.length > 300) {
      return invalid({ address: "Use 300 characters or fewer. Nothing was shortened." });
    }
    return ready(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
      suggestClip(address) || "Map",
      [MAPS_NOTE],
    );
  }

  if (blankText(fields.url)) {
    return empty("Paste a maps URL.");
  }
  const url = readHttpUrl(fields.url);
  if (!url.ok) {
    return invalid({ url: url.error });
  }
  let mapsHost = false;
  try {
    mapsHost = /google\.|goo\.gl|maps\.app/i.test(new URL(url.url).hostname);
  } catch {
    mapsHost = false;
  }
  return ready(url.url, siteName(url.url), mapsHost ? [MAPS_NOTE] : []);
}

function buildPaymentLink(fields: FormMap["payment-link"]): BuildResult {
  if (blankText(fields.url)) {
    return empty("Paste a payment or checkout URL.");
  }
  const url = readHttpUrl(fields.url, true);
  if (!url.ok) {
    return invalid({ url: url.error });
  }
  return ready(url.url, siteName(url.url), [
    {
      tone: "warning",
      text: "This QR code stores the payment URL itself and does not expire. The payment page can still be disabled by the provider. Scanning it opens that page; it does not send money by itself.",
    },
  ]);
}

function buildPaymentDetails(fields: FormMap["payment-details"]): BuildResult {
  const method = z.enum(["sepa", "upi", "bitcoin", "custom"]).safeParse(fields.method);
  if (!method.success) {
    return invalid({ method: "Choose a payment format." });
  }

  if (method.data === "sepa") {
    const blank = [
      fields.sepaName,
      fields.sepaIban,
      fields.sepaBic,
      fields.sepaAmount,
      fields.sepaPurpose,
      fields.sepaRemittance,
    ].every((value) => value.trim() === "");
    if (blank) {
      return empty("Enter the account holder and IBAN.");
    }
    const sepa = buildSepaPayload(fields);
    if (!sepa.ok) {
      return invalid(sepa.fieldErrors);
    }
    return ready(sepa.payload, sepa.suggestedName, [
      PAYMENT_SCAN_NOTE,
      {
        tone: "info",
        text: "This is a SEPA credit transfer request in euro (EPC QR). A compatible banking app may offer to start a transfer. The currency cannot be changed in this format.",
      },
    ]);
  }

  if (method.data === "upi") {
    const blank = [fields.upiVpa, fields.upiName, fields.upiAmount, fields.upiNote].every(
      (value) => value.trim() === "",
    );
    if (blank) {
      return empty("Enter a UPI ID and payee name.");
    }
    const upi = buildUpiPayload(fields);
    if (!upi.ok) {
      return invalid(upi.fieldErrors);
    }
    return ready(upi.payload, upi.suggestedName, [
      PAYMENT_SCAN_NOTE,
      {
        tone: "info",
        text: "This stores a UPI payment request in INR. A UPI app may offer to pay it.",
      },
    ]);
  }

  if (method.data === "bitcoin") {
    const blank = [fields.btcAddress, fields.btcAmount, fields.btcLabel, fields.btcMessage].every(
      (value) => value.trim() === "",
    );
    if (blank) {
      return empty("Enter a Bitcoin address.");
    }
    const bitcoin = buildBitcoinPayload(fields);
    if (!bitcoin.ok) {
      return invalid(bitcoin.fieldErrors);
    }
    return ready(bitcoin.payload, bitcoin.suggestedName, [
      PAYMENT_SCAN_NOTE,
      {
        tone: "info",
        text: "This stores a Bitcoin address in BIP-21 form. A wallet may offer to send bitcoin. The amount is in BTC.",
      },
    ]);
  }

  if (fields.customPayload.trim().length === 0) {
    return empty("Paste the official payment payload.");
  }
  return ready(fields.customPayload, "Payment", [
    PAYMENT_SCAN_NOTE,
    {
      tone: "info",
      text: "This text is stored exactly as entered. Use a payload copied from your bank or wallet. If the format is not listed above, do not try to invent it.",
    },
  ]);
}

function buildSocial(fields: FormMap["social"]): BuildResult {
  const platform = z
    .enum(["instagram", "x", "facebook", "linkedin", "youtube", "tiktok", "github", "telegram", "custom"])
    .safeParse(fields.platform);
  if (!platform.success) {
    return invalid({ platform: "Choose a network." });
  }
  const raw = fields.username.trim();
  if (!raw) {
    return empty(platform.data === "custom" ? "Paste a profile URL." : "Enter a username or paste a profile URL.");
  }
  if (/^https?:\/\//i.test(raw)) {
    const url = readHttpUrl(raw);
    if (!url.ok) {
      return invalid({ username: url.error });
    }
    return ready(url.url, siteName(url.url));
  }
  if (platform.data === "custom") {
    return invalid({ username: "Paste a full profile URL, including https://." });
  }
  const username = raw.replace(/^@/, "");
  if (!/^[A-Za-z0-9._-]{1,64}$/.test(username)) {
    return invalid({
      username: "Use letters, numbers, dots, dashes, or underscores, or paste a full https:// URL.",
    });
  }
  return ready(SOCIAL_PROFILES[platform.data](username), username);
}

function buildApp(fields: FormMap["app"]): BuildResult {
  const store = z.enum(["apple", "google", "custom"]).safeParse(fields.store);
  if (!store.success) {
    return invalid({ store: "Choose a store." });
  }
  const value = fields.value.trim();
  if (!value) {
    return empty("Enter an app id, package name, or download URL.");
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^https?:/i.test(value)) {
    return invalid({ value: "Use an http:// or https:// URL, an App Store id, or a Play package name." });
  }
  if (/^https?:\/\//i.test(value)) {
    const url = readHttpUrl(value);
    if (!url.ok) {
      return invalid({ value: url.error });
    }
    return ready(url.url, siteName(url.url), [STORE_NOTE]);
  }
  if (store.data === "apple") {
    const id = value.replace(/^id/i, "");
    if (!/^\d{6,12}$/.test(id)) {
      return invalid({ value: "Enter a numeric App Store id, or paste the full App Store URL." });
    }
    return ready(`https://apps.apple.com/app/id${id}`, "App Store", [STORE_NOTE]);
  }
  if (store.data === "google") {
    if (!/^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/.test(value)) {
      return invalid({
        value: "Enter a package name such as com.example.app, or paste the full Play Store URL.",
      });
    }
    return ready(
      `https://play.google.com/store/apps/details?id=${encodeURIComponent(value)}`,
      "Google Play",
      [STORE_NOTE],
    );
  }
  return invalid({ value: "Paste a direct download URL starting with https://." });
}

function buildCustom(fields: FormMap["custom"]): BuildResult {
  const mode = fields.mode === "text" ? "text" : "url";
  if (mode === "url") {
    if (blankText(fields.value)) {
      return empty("Enter a URL to encode.");
    }
    const url = readHttpUrl(fields.value);
    if (!url.ok) {
      return invalid({ value: url.error });
    }
    return ready(url.url, siteName(url.url), [
      { tone: "info", text: "The URL is stored exactly as entered." },
    ]);
  }
  if (blankText(fields.value)) {
    return empty("Enter the text to encode.");
  }
  return ready(fields.value, "Custom", [
    { tone: "info", text: "This text is stored exactly as entered." },
  ]);
}

export function buildPayload(type: QrType, fields: FormMap[QrType]): BuildResult {
  switch (type) {
    case "url":
      return buildUrl(fields as FormMap["url"]);
    case "text":
      return buildText(fields as FormMap["text"]);
    case "email":
      return buildEmail(fields as FormMap["email"]);
    case "phone":
      return buildPhone(fields as FormMap["phone"]);
    case "sms":
      return buildSmsPayload(fields as FormMap["sms"]);
    case "wifi":
      return buildWifi(fields as FormMap["wifi"]);
    case "vcard":
      return buildVCardPayload(fields as FormMap["vcard"]);
    case "whatsapp":
      return buildWhatsapp(fields as FormMap["whatsapp"]);
    case "location":
      return buildLocation(fields as FormMap["location"]);
    case "payment-link":
      return buildPaymentLink(fields as FormMap["payment-link"]);
    case "payment-details":
      return buildPaymentDetails(fields as FormMap["payment-details"]);
    case "social":
      return buildSocial(fields as FormMap["social"]);
    case "app":
      return buildApp(fields as FormMap["app"]);
    case "custom":
      return buildCustom(fields as FormMap["custom"]);
    default: {
      const unhandled: never = type;
      return unhandled;
    }
  }
}
