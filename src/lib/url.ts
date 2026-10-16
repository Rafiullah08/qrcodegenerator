import { firstIssue } from "@/lib/schemas";
import { z } from "zod";

const BLOCKED_PROTOCOLS = new Set(["javascript:", "data:", "vbscript:", "file:", "blob:"]);

const trimmedUrl = z.string().trim().min(1, "Enter a URL.");

export function readHttpUrl(
  input: string,
  httpsOnly = false,
): { ok: true; url: string } | { ok: false; error: string } {
  const parsed = trimmedUrl.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssue(parsed.error) };
  }

  const value = parsed.data;
  if (/\s/.test(value)) {
    return { ok: false, error: "The URL cannot contain spaces." };
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return {
      ok: false,
      error: httpsOnly
        ? "Enter a full payment URL, including https://."
        : "Enter a full URL, including https://.",
    };
  }

  const protocol = url.protocol.toLowerCase();
  if (BLOCKED_PROTOCOLS.has(protocol)) {
    return { ok: false, error: "This URL type cannot be encoded." };
  }
  if (httpsOnly && protocol !== "https:") {
    return { ok: false, error: "Payment links must start with https://." };
  }
  if (!httpsOnly && protocol !== "http:" && protocol !== "https:") {
    return { ok: false, error: "Use an http:// or https:// URL." };
  }
  if (!url.hostname) {
    return { ok: false, error: "Enter a complete URL." };
  }

  return { ok: true, url: value };
}

export function siteName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Link";
  }
}
