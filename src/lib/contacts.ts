import { utf8ByteLength } from "@/lib/capacity";
import { emailSchema, firstIssue } from "@/lib/schemas";
import { readHttpUrl } from "@/lib/url";

export function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

export function buildWifiPayload(
  ssid: string,
  password: string,
  encryption: "WPA" | "WEP" | "nopass",
  hidden: boolean,
): string {
  const secret = encryption === "nopass" ? "" : escapeWifi(password);
  return `WIFI:T:${encryption};S:${escapeWifi(ssid)};P:${secret};H:${hidden ? "true" : "false"};;`;
}

export function wifiFieldErrors(input: {
  ssid: string;
  password: string;
  encryption: "WPA" | "WEP" | "nopass";
}): Record<string, string> {
  const errors: Record<string, string> = {};
  const ssid = input.ssid;
  if (!ssid.trim()) {
    errors.ssid = "Enter the network name.";
  } else if (utf8ByteLength(ssid) > 32) {
    errors.ssid = "A Wi-Fi name can be at most 32 bytes. Nothing was shortened.";
  } else if (/[\u0000-\u001F]/.test(ssid)) {
    errors.ssid = "The network name cannot include line breaks.";
  }

  if (input.encryption === "nopass") {
    if (input.password.trim()) {
      errors.password = "Clear the password, or choose WPA or WEP.";
    }
  } else if (!input.password) {
    errors.password = "Enter the network password.";
  } else if (utf8ByteLength(input.password) > 63) {
    errors.password = "This password is longer than 63 bytes. Nothing was shortened.";
  }

  return errors;
}

export function buildMailto(email: string, subject: string, body: string): string {
  const params: string[] = [];
  if (subject) {
    params.push(`subject=${encodeURIComponent(subject)}`);
  }
  if (body) {
    params.push(`body=${encodeURIComponent(body)}`);
  }
  return params.length > 0 ? `mailto:${email}?${params.join("&")}` : `mailto:${email}`;
}

export function readEmail(input: string): { ok: true; email: string } | { ok: false; error: string } {
  const parsed = emailSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssue(parsed.error) };
  }
  return { ok: true, email: parsed.data };
}

export function buildSms(phone: string, message: string): string {
  if (!message) {
    return `sms:${phone}`;
  }
  return `sms:${phone}?body=${encodeURIComponent(message)}`;
}

export function buildWhatsApp(digits: string, message: string): string {
  if (!message) {
    return `https://wa.me/${digits}`;
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function escapeVCard(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\n|\r/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) {
    return line;
  }

  const parts: string[] = [];
  let current = "";
  let currentBytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    const limit = parts.length === 0 ? 75 : 74;
    if (current && currentBytes + size > limit) {
      parts.push(current);
      current = char;
      currentBytes = size;
    } else {
      current += char;
      currentBytes += size;
    }
  }
  if (current) {
    parts.push(current);
  }
  return parts.map((part, index) => (index === 0 ? part : ` ${part}`)).join("\r\n");
}

export type VCardInput = {
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  phone: string;
  email: string;
  website: string;
  street: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  note: string;
};

export function buildVCard(input: VCardInput): string {
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];
  const first = input.firstName.trim();
  const last = input.lastName.trim();
  if (first || last) {
    lines.push(`N:${escapeVCard(last)};${escapeVCard(first)};;;`);
    lines.push(`FN:${escapeVCard([first, last].filter(Boolean).join(" "))}`);
  }
  if (input.organization.trim()) {
    lines.push(`ORG:${escapeVCard(input.organization.trim())}`);
  }
  if (input.title.trim()) {
    lines.push(`TITLE:${escapeVCard(input.title.trim())}`);
  }
  if (input.phone) {
    lines.push(`TEL;TYPE=CELL:${input.phone}`);
  }
  if (input.email) {
    lines.push(`EMAIL:${input.email}`);
  }
  if (input.website) {
    lines.push(`URL:${input.website}`);
  }

  const street = input.street.trim();
  const city = input.city.trim();
  const region = input.region.trim();
  const postalCode = input.postalCode.trim();
  const country = input.country.trim();
  if (street || city || region || postalCode || country) {
    lines.push(
      `ADR;TYPE=HOME:;;${[street, city, region, postalCode, country].map(escapeVCard).join(";")}`,
    );
  }
  if (input.note.trim()) {
    lines.push(`NOTE:${escapeVCard(input.note.trim())}`);
  }
  lines.push("END:VCARD");
  return lines.map(foldLine).join("\r\n");
}

export function optionalWebsite(
  input: string,
): { ok: true; url: string } | { ok: false; error: string } {
  if (!input.trim()) {
    return { ok: true, url: "" };
  }
  return readHttpUrl(input);
}
