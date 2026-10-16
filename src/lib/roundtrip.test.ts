import jsQR from "jsqr";
import { PNG } from "pngjs";
import QRCode from "qrcode";
import { describe, expect, it } from "vitest";
import { defaultForms } from "@/lib/defaults";
import { buildPayload } from "@/lib/payloads";
import type { FormMap, QrType } from "@/lib/types";

async function scan(payload: string): Promise<string | null> {
  const buffer = await QRCode.toBuffer(payload, {
    errorCorrectionLevel: "M",
    margin: 4,
    width: 512,
    type: "png",
    color: { dark: "#000000", light: "#ffffff" },
  });
  const png = PNG.sync.read(buffer);
  const pixels = new Uint8ClampedArray(png.data);
  return jsQR(pixels, png.width, png.height)?.data ?? null;
}

const samples: { type: QrType; fields: FormMap[QrType] }[] = [
  { type: "url", fields: { url: "https://example.com/docs?q=qr%20studio#start" } },
  { type: "text", fields: { text: "Hello, こんにちは" } },
  {
    type: "email",
    fields: { email: "ada@example.com", subject: "Hello", body: "Line 1" },
  },
  { type: "sms", fields: { phone: "+14155552671", message: "On my way" } },
  {
    type: "wifi",
    fields: { ssid: "Cafe;Net", password: "p:ass", encryption: "WPA", hidden: false },
  },
  {
    type: "vcard",
    fields: {
      ...defaultForms().vcard,
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
    },
  },
  { type: "whatsapp", fields: { phone: "14155552671", message: "Hello" } },
  {
    type: "payment-link",
    fields: { url: "https://pay.example.com/checkout/100?ref=a" },
  },
  {
    type: "payment-details",
    fields: {
      ...defaultForms()["payment-details"],
      method: "sepa",
      sepaName: "Ada Lovelace",
      sepaIban: "DE89370400440532013000",
      sepaAmount: "12.50",
      sepaRemittance: "Invoice 100",
    },
  },
];

describe("scannable payloads", () => {
  it("decodes each sample back to the original payload", async () => {
    const payloads = samples.map((sample) => {
      const built = buildPayload(sample.type, sample.fields);
      expect(built.status).toBe("ready");
      if (built.status !== "ready") {
        throw new Error(`Expected a ${sample.type} payload`);
      }
      return built.payload;
    });
    const decoded = await Promise.all(payloads.map((payload) => scan(payload)));
    decoded.forEach((value, index) => {
      expect(value).toBe(payloads[index]);
    });
  }, 20000);
});
