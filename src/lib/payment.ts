import { canonicalBitcoinAddress, normalizeBtcAmount } from "@/lib/bitcoin";
import type { FormMap } from "@/lib/types";

const IBAN_LENGTHS: Record<string, number> = {
  AL: 28, AD: 24, AT: 20, AZ: 28, BH: 22, BE: 16, BA: 20, BR: 29, BG: 22,
  CR: 22, HR: 21, CY: 28, CZ: 24, DK: 18, DO: 28, TL: 23, EE: 20, FO: 18,
  FI: 18, FR: 27, GE: 22, DE: 22, GI: 23, GR: 27, GL: 18, GT: 28, HU: 28,
  IS: 26, IQ: 23, IE: 22, IL: 23, IT: 27, JO: 30, KZ: 20, XK: 20, KW: 30,
  LV: 21, LB: 28, LI: 21, LT: 20, LU: 20, MK: 19, MT: 31, MR: 27, MU: 30,
  MC: 27, MD: 24, ME: 22, NL: 18, NO: 15, PK: 24, PS: 29, PL: 28, PT: 25,
  QA: 29, RO: 24, LC: 32, SM: 27, ST: 25, SA: 24, RS: 22, SC: 31, SK: 24,
  SI: 19, ES: 24, SE: 24, CH: 21, TN: 24, TR: 26, UA: 29, AE: 23, GB: 22,
  VA: 22, VG: 24, EG: 29, LY: 25, SD: 18, BY: 28, SV: 28, OM: 23,
};

export type FieldFailure = { ok: false; fieldErrors: Record<string, string> };
export type FieldSuccess = { ok: true; payload: string; suggestedName: string };

function ibanMod97(iban: string): boolean {
  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`;
  let remainder = 0;
  for (const char of rearranged) {
    const expanded = char >= "A" && char <= "Z" ? String(char.charCodeAt(0) - 55) : char;
    for (const digit of expanded) {
      remainder = (remainder * 10 + Number(digit)) % 97;
    }
  }
  return remainder === 1;
}

export function validateIban(input: string): { ok: true; iban: string } | { ok: false; error: string } {
  const iban = input.replace(/\s+/g, "").toUpperCase();
  if (!iban) {
    return { ok: false, error: "Enter an IBAN." };
  }
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) {
    return { ok: false, error: "An IBAN starts with two letters, two check digits, and the account characters." };
  }
  const expected = IBAN_LENGTHS[iban.slice(0, 2)];
  if (expected && iban.length !== expected) {
    return {
      ok: false,
      error: `A ${iban.slice(0, 2)} IBAN must be ${expected} characters, not counting spaces.`,
    };
  }
  if (!expected && (iban.length < 15 || iban.length > 34)) {
    return { ok: false, error: "This IBAN has an unexpected length." };
  }
  if (!ibanMod97(iban)) {
    return { ok: false, error: "This IBAN failed its checksum. Check it for a typo." };
  }
  return { ok: true, iban };
}

export function validateBic(input: string): { ok: true; bic: string } | { ok: false; error: string } {
  const bic = input.replace(/\s+/g, "").toUpperCase();
  if (!bic) {
    return { ok: true, bic: "" };
  }
  if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic)) {
    return { ok: false, error: "A BIC is 8 or 11 letters and digits. Leave it blank if you do not have one." };
  }
  return { ok: true, bic };
}

function formatEur(input: string): { ok: true; amount: string } | { ok: false; error: string } {
  const amount = input.trim();
  if (!amount) {
    return { ok: true, amount: "" };
  }
  if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
    return { ok: false, error: "Enter the amount in euro, such as 12.50." };
  }
  const value = Number(amount);
  if (!(value >= 0.01)) {
    return { ok: false, error: "The minimum SEPA QR amount is 0.01 euro, or leave it blank." };
  }
  const formatted = `EUR${value.toFixed(2)}`;
  if (formatted.length > 12) {
    return { ok: false, error: "SEPA QR amounts must be 999999.99 euro or less." };
  }
  return { ok: true, amount: formatted };
}

function rejectControls(value: string, message: string): string | null {
  if (/[\u0000-\u001F\u007F]/.test(value)) {
    return message;
  }
  return null;
}

export function buildSepaPayload(fields: FormMap["payment-details"]): FieldFailure | FieldSuccess {
  const fieldErrors: Record<string, string> = {};
  const name = fields.sepaName.trim();
  if (!name) {
    fieldErrors.sepaName = "Enter the account holder's name.";
  } else if (name.length > 70) {
    fieldErrors.sepaName = "The account holder name must be 70 characters or fewer.";
  } else {
    const control = rejectControls(name, "The account holder name cannot include line breaks.");
    if (control) {
      fieldErrors.sepaName = control;
    }
  }

  const iban = validateIban(fields.sepaIban);
  if (!iban.ok) {
    fieldErrors.sepaIban = iban.error;
  }

  const bic = validateBic(fields.sepaBic);
  if (!bic.ok) {
    fieldErrors.sepaBic = bic.error;
  }

  const amount = formatEur(fields.sepaAmount);
  if (!amount.ok) {
    fieldErrors.sepaAmount = amount.error;
  }

  const purposeInput = fields.sepaPurpose.trim();
  let purpose = "";
  if (purposeInput) {
    purpose = purposeInput.toUpperCase();
    if (!/^[A-Z]{4}$/.test(purpose)) {
      fieldErrors.sepaPurpose = "A purpose code is exactly 4 letters, such as GDDS. Leave it blank if you do not have one.";
    }
  }

  const remittance = fields.sepaRemittance.trim();
  if (remittance.length > 140) {
    fieldErrors.sepaRemittance = "The payment reference must be 140 characters or fewer.";
  } else {
    const control = rejectControls(remittance, "The payment reference cannot include line breaks.");
    if (control) {
      fieldErrors.sepaRemittance = control;
    }
  }

  if (Object.keys(fieldErrors).length > 0 || !iban.ok || !bic.ok || !amount.ok) {
    return { ok: false, fieldErrors };
  }

  const lines = [
    "BCD",
    "002",
    "1",
    "SCT",
    bic.bic,
    name,
    iban.iban,
    amount.amount,
    purpose,
    "",
    remittance,
  ];
  while (lines.length > 7 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  return { ok: true, payload: lines.join("\n"), suggestedName: name };
}

function formatUpiAmount(input: string): { ok: true; amount: string } | { ok: false; error: string } {
  const amount = input.trim();
  if (!amount) {
    return { ok: true, amount: "" };
  }
  if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
    return { ok: false, error: "Enter the amount in INR, such as 100.00." };
  }
  const value = Number(amount);
  if (!(value > 0) || value > 9_999_999.99) {
    return { ok: false, error: "Enter an amount greater than 0 and at most 9999999.99." };
  }
  return { ok: true, amount: value.toFixed(2) };
}

export function buildUpiPayload(fields: FormMap["payment-details"]): FieldFailure | FieldSuccess {
  const fieldErrors: Record<string, string> = {};
  const vpa = fields.upiVpa.trim();
  if (!/^[\w.-]{2,64}@[A-Za-z]{2,64}$/.test(vpa)) {
    fieldErrors.upiVpa = "Enter a UPI ID such as name@bank.";
  }

  const name = fields.upiName.trim();
  if (!name) {
    fieldErrors.upiName = "Enter the payee name.";
  } else if (name.length > 50) {
    fieldErrors.upiName = "The payee name must be 50 characters or fewer.";
  }

  const amount = formatUpiAmount(fields.upiAmount);
  if (!amount.ok) {
    fieldErrors.upiAmount = amount.error;
  }

  const note = fields.upiNote.trim();
  if (note.length > 80) {
    fieldErrors.upiNote = "The note must be 80 characters or fewer.";
  }

  if (Object.keys(fieldErrors).length > 0 || !amount.ok) {
    return { ok: false, fieldErrors };
  }

  const params = [`pa=${vpa}`, `pn=${encodeURIComponent(name)}`];
  if (amount.amount) {
    params.push(`am=${amount.amount}`);
  }
  params.push("cu=INR");
  if (note) {
    params.push(`tn=${encodeURIComponent(note)}`);
  }

  return {
    ok: true,
    payload: `upi://pay?${params.join("&")}`,
    suggestedName: name,
  };
}

export function buildBitcoinPayload(fields: FormMap["payment-details"]): FieldFailure | FieldSuccess {
  const fieldErrors: Record<string, string> = {};
  const address = canonicalBitcoinAddress(fields.btcAddress);
  if (!address.ok) {
    fieldErrors.btcAddress = address.error;
  }

  const amount = normalizeBtcAmount(fields.btcAmount);
  if (!amount.ok) {
    fieldErrors.btcAmount = amount.error;
  }

  const label = fields.btcLabel.trim();
  const message = fields.btcMessage.trim();
  if (label.length > 80) {
    fieldErrors.btcLabel = "The label must be 80 characters or fewer.";
  }
  if (message.length > 140) {
    fieldErrors.btcMessage = "The message must be 140 characters or fewer.";
  }

  if (Object.keys(fieldErrors).length > 0 || !address.ok || !amount.ok) {
    return { ok: false, fieldErrors };
  }

  const params: string[] = [];
  if (amount.amount) {
    params.push(`amount=${amount.amount}`);
  }
  if (label) {
    params.push(`label=${encodeURIComponent(label)}`);
  }
  if (message) {
    params.push(`message=${encodeURIComponent(message)}`);
  }
  const query = params.length > 0 ? `?${params.join("&")}` : "";

  return {
    ok: true,
    payload: `bitcoin:${address.address}${query}`,
    suggestedName: label || "Bitcoin",
  };
}
