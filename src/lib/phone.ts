export function normalizePhone(
  input: string,
): { ok: true; phone: string } | { ok: false; error: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: "Enter a phone number." };
  }
  if (/[a-z]/i.test(trimmed)) {
    return { ok: false, error: "Phone numbers cannot include letters." };
  }

  let compact = trimmed.replace(/[\s().-]/g, "");
  if (compact.startsWith("00")) {
    compact = `+${compact.slice(2)}`;
  }
  if (!/^\+?\d+$/.test(compact)) {
    return {
      ok: false,
      error: "Use digits, spaces, or dashes, and an optional leading +.",
    };
  }

  const digits = compact.startsWith("+") ? compact.slice(1) : compact;
  if (digits.length < 4 || digits.length > 15) {
    return { ok: false, error: "Enter 4 to 15 digits." };
  }

  return { ok: true, phone: compact };
}

export function whatsAppNumber(
  input: string,
): { ok: true; digits: string } | { ok: false; error: string } {
  const normalized = normalizePhone(input);
  if (!normalized.ok) {
    return normalized;
  }

  const digits = normalized.phone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return {
      ok: false,
      error: "WhatsApp needs a country code, without a leading 0. For example, 14155552671.",
    };
  }
  if (digits.length < 8 || digits.length > 15) {
    return { ok: false, error: "Enter the country code and number, 8 to 15 digits." };
  }

  return { ok: true, digits };
}
