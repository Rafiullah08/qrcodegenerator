import { sha256 } from "@/lib/sha256";

const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BECH32 = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const BECH32M_CONST = 0x2bc830a3;

function base58Decode(input: string): Uint8Array | null {
  if (!input || [...input].some((char) => !BASE58.includes(char))) {
    return null;
  }

  let zeros = 0;
  while (zeros < input.length && input[zeros] === "1") {
    zeros += 1;
  }

  const bytes: number[] = [];
  for (const char of input) {
    let carry = BASE58.indexOf(char);
    for (let index = 0; index < bytes.length; index += 1) {
      carry += bytes[index] * 58;
      bytes[index] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }

  const decoded = new Uint8Array(zeros + bytes.length);
  for (let index = 0; index < bytes.length; index += 1) {
    decoded[decoded.length - 1 - index] = bytes[index];
  }
  return decoded;
}

function isValidBase58Address(address: string): boolean {
  const decoded = base58Decode(address);
  if (!decoded || decoded.length !== 25) {
    return false;
  }
  const version = decoded[0];
  if (version !== 0x00 && version !== 0x05) {
    return false;
  }
  const payload = decoded.slice(0, -4);
  const checksum = decoded.slice(-4);
  const hash = sha256(sha256(payload));
  return checksum.every((byte, index) => byte === hash[index]);
}

function polymod(values: number[]): number {
  const generators = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let checksum = 1;
  for (const value of values) {
    const top = checksum >> 25;
    checksum = ((checksum & 0x1ffffff) << 5) ^ value;
    for (let index = 0; index < 5; index += 1) {
      if (((top >> index) & 1) === 1) {
        checksum ^= generators[index];
      }
    }
  }
  return checksum >>> 0;
}

function hrpExpand(hrp: string): number[] {
  const expanded: number[] = [];
  for (let index = 0; index < hrp.length; index += 1) {
    expanded.push(hrp.charCodeAt(index) >> 5);
  }
  expanded.push(0);
  for (let index = 0; index < hrp.length; index += 1) {
    expanded.push(hrp.charCodeAt(index) & 31);
  }
  return expanded;
}

function convertBits(data: number[], from: number, to: number): number[] | null {
  let accumulator = 0;
  let bits = 0;
  const result: number[] = [];
  const max = (1 << to) - 1;
  for (const value of data) {
    if (value < 0 || value >> from !== 0) {
      return null;
    }
    accumulator = (accumulator << from) | value;
    bits += from;
    while (bits >= to) {
      bits -= to;
      result.push((accumulator >> bits) & max);
    }
  }
  if (bits >= from || ((accumulator << (to - bits)) & max) !== 0) {
    return null;
  }
  return result;
}

function isValidBech32Address(address: string): boolean {
  if (address !== address.toLowerCase() && address !== address.toUpperCase()) {
    return false;
  }
  const lower = address.toLowerCase();
  const separator = lower.lastIndexOf("1");
  if (separator < 1 || lower.length < separator + 8 || lower.length > 90) {
    return false;
  }
  const hrp = lower.slice(0, separator);
  if (hrp !== "bc") {
    return false;
  }

  const data: number[] = [];
  for (const char of lower.slice(separator + 1)) {
    const value = BECH32.indexOf(char);
    if (value === -1) {
      return false;
    }
    data.push(value);
  }

  const witnessVersion = data[0];
  if (witnessVersion > 16) {
    return false;
  }
  const constant = witnessVersion === 0 ? 1 : BECH32M_CONST;
  if (polymod(hrpExpand(hrp).concat(data)) !== constant) {
    return false;
  }

  const program = convertBits(data.slice(1, -6), 5, 8);
  if (!program || program.length < 2 || program.length > 40) {
    return false;
  }
  if (witnessVersion === 0 && program.length !== 20 && program.length !== 32) {
    return false;
  }
  if (witnessVersion === 1 && program.length !== 32) {
    return false;
  }
  return true;
}

export function canonicalBitcoinAddress(
  input: string,
): { ok: true; address: string } | { ok: false; error: string } {
  const address = input.trim();
  if (!address) {
    return { ok: false, error: "Enter a Bitcoin address." };
  }
  if (address.toLowerCase().startsWith("bc1")) {
    if (!isValidBech32Address(address)) {
      return { ok: false, error: "This Bitcoin address failed its checksum." };
    }
    return { ok: true, address: address.toLowerCase() };
  }
  if (!isValidBase58Address(address)) {
    return {
      ok: false,
      error: "Enter a mainnet Bitcoin address starting with 1, 3, or bc1.",
    };
  }
  return { ok: true, address };
}

export function normalizeBtcAmount(
  input: string,
): { ok: true; amount: string } | { ok: false; error: string } {
  const amount = input.trim();
  if (!amount) {
    return { ok: true, amount: "" };
  }
  if (!/^(?:0|[1-9]\d{0,7})(?:\.\d{1,8})?$/.test(amount)) {
    return { ok: false, error: "Enter the amount in BTC with up to 8 decimal places." };
  }
  const value = Number(amount);
  if (!(value > 0) || value > 21_000_000) {
    return { ok: false, error: "Enter a Bitcoin amount greater than 0 and at most 21000000." };
  }
  return { ok: true, amount };
}
