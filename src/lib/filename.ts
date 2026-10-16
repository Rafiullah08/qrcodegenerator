export function suggestClip(value: string, max = 48): string {
  const clean = value.trim().replace(/\s+/g, " ");
  if (clean.length <= max) {
    return clean;
  }
  return clean.slice(0, max).trim();
}

export function buildFilename(type: string, label: string, extension: string): string {
  const slug = label
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const typeSlug = type.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const base = slug ? `qr-studio-${typeSlug}-${slug}` : `qr-studio-${typeSlug || "code"}`;
  return `${base}.${extension}`;
}
