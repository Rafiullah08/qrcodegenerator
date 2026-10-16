import { describe, expect, it } from "vitest";
import { defaultForms } from "@/lib/defaults";
import { buildPayload } from "@/lib/payloads";
import { validateIban } from "@/lib/payment";
import type { FormMap } from "@/lib/types";

const base = defaultForms()["payment-details"];

function details(patch: Partial<FormMap["payment-details"]>): FormMap["payment-details"] {
  return { ...base, ...patch };
}

describe("payment URLs", () => {
  it("stores an https payment link exactly", () => {
    const url = "https://pay.example.com/checkout/order-1001?ref=a%2Fb#paid";
    const result = buildPayload("payment-link", { url: ` ${url} ` });
    expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.payload).toBe(url);
      expect(result.notices.some((notice) => notice.text.includes("does not send money"))).toBe(true);
    }
  });

  it("rejects payment links that are not https", () => {
    const result = buildPayload("payment-link", { url: "http://pay.example.com/checkout" });
    expect(result.status).toBe("invalid");
  });
});

describe("SEPA EPC payloads", () => {
  it("validates known IBANs and rejects a bad checksum", () => {
    expect(validateIban("DE89 3704 0044 0532 0130 00").ok).toBe(true);
    expect(validateIban("GB82 WEST 1234 5698 7654 32").ok).toBe(true);
    expect(validateIban("DE89 3704 0044 0532 0130 01").ok).toBe(false);
  });

  it("builds a version 002 EPC payload without truncating the reference", () => {
    const result = buildPayload(
      "payment-details",
      details({
        method: "sepa",
        sepaName: "Ada Lovelace",
        sepaIban: "DE89 3704 0044 0532 0130 00",
        sepaAmount: "12.5",
        sepaPurpose: "gdds",
        sepaRemittance: "Invoice 100",
      }),
    );
    expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.payload).toBe(
        [
          "BCD",
          "002",
          "1",
          "SCT",
          "",
          "Ada Lovelace",
          "DE89370400440532013000",
          "EUR12.50",
          "GDDS",
          "",
          "Invoice 100",
        ].join("\n"),
      );
    }
  });

  it("omits trailing empty EPC fields and rejects an amount that does not fit", () => {
    const open = buildPayload(
      "payment-details",
      details({
        method: "sepa",
        sepaName: "Ada Lovelace",
        sepaIban: "DE89370400440532013000",
      }),
    );
    expect(open.status).toBe("ready");
    if (open.status === "ready") {
      expect(open.payload).toBe("BCD\n002\n1\nSCT\n\nAda Lovelace\nDE89370400440532013000");
    }

    const tooBig = buildPayload(
      "payment-details",
      details({
        method: "sepa",
        sepaName: "Ada Lovelace",
        sepaIban: "DE89370400440532013000",
        sepaAmount: "1000000",
      }),
    );
    expect(tooBig.status).toBe("invalid");
  });

  it("does not round an amount with too many decimal places", () => {
    const result = buildPayload(
      "payment-details",
      details({
        method: "sepa",
        sepaName: "Ada Lovelace",
        sepaIban: "DE89370400440532013000",
        sepaAmount: "12.555",
      }),
    );
    expect(result.status).toBe("invalid");
  });
});

describe("UPI and Bitcoin payloads", () => {
  it("builds a UPI request in INR", () => {
    const result = buildPayload(
      "payment-details",
      details({
        method: "upi",
        upiVpa: "shop@okhdfcbank",
        upiName: "North Wind",
        upiAmount: "10",
        upiNote: "Table 4 & co",
      }),
    );
    expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.payload).toBe(
        "upi://pay?pa=shop@okhdfcbank&pn=North%20Wind&am=10.00&cu=INR&tn=Table%204%20%26%20co",
      );
    }
  });

  it("requires a UPI ID and does not invent a card payload", () => {
    const result = buildPayload(
      "payment-details",
      details({ method: "upi", upiName: "Shop" }),
    );
    expect(result.status).toBe("invalid");
    if (result.status === "invalid") {
      expect(result.fieldErrors.upiVpa).toBeTruthy();
      expect(JSON.stringify(result)).not.toMatch(/cvv|cvc|password/i);
    }
  });

  it("builds a BIP-21 URI and keeps a custom payload unchanged", () => {
    const bitcoin = buildPayload(
      "payment-details",
      details({
        method: "bitcoin",
        btcAddress: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        btcAmount: "0.50",
        btcLabel: "Coffee fund",
      }),
    );
    expect(bitcoin.status).toBe("ready");
    if (bitcoin.status === "ready") {
      expect(bitcoin.payload).toBe(
        "bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?amount=0.50&label=Coffee%20fund",
      );
    }

    const custom = "00020101021126580014BR.GOV.BCB.PIX";
    const pasted = buildPayload(
      "payment-details",
      details({ method: "custom", customPayload: custom }),
    );
    expect(pasted.status).toBe("ready");
    if (pasted.status === "ready") {
      expect(pasted.payload).toBe(custom);
    }
  });
});
