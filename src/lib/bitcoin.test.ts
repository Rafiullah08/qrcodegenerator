import { describe, expect, it } from "vitest";
import { canonicalBitcoinAddress } from "@/lib/bitcoin";
import { sha256Hex } from "@/lib/sha256";

describe("sha256", () => {
  it("matches the empty-string and abc test vectors", () => {
    expect(sha256Hex(new Uint8Array())).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
    expect(sha256Hex(new TextEncoder().encode("abc"))).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});

describe("bitcoin addresses", () => {
  it("accepts known mainnet addresses and rejects a broken checksum", () => {
    expect(canonicalBitcoinAddress("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa").ok).toBe(true);
    expect(canonicalBitcoinAddress("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4").ok).toBe(true);
    expect(canonicalBitcoinAddress("BC1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4").ok).toBe(true);
    expect(canonicalBitcoinAddress("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t5").ok).toBe(false);
    expect(canonicalBitcoinAddress("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNb").ok).toBe(false);
  });

  it("lowercases bech32 addresses for the QR payload", () => {
    const result = canonicalBitcoinAddress("BC1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.address).toBe("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4");
    }
  });
});
