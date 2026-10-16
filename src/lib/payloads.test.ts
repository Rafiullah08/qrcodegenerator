import { describe, expect, it } from "vitest";
import { finalizePayload } from "@/lib/capacity";
import { defaultForms } from "@/lib/defaults";
import { buildPayload } from "@/lib/payloads";
import { QR_TYPES, type FormMap } from "@/lib/types";

const forms = defaultForms();

function readyPayload(type: Parameters<typeof buildPayload>[0], fields: FormMap[typeof type]) {
  const result = buildPayload(type, fields);
  expect(result.status).toBe("ready");
  if (result.status !== "ready") {
    throw new Error("expected a ready payload");
  }
  return result;
}

describe("default forms", () => {
  it("does not throw or invent a payload when every field is empty", () => {
    for (const type of QR_TYPES) {
      const result = buildPayload(type, forms[type]);
      expect(result.status).toBe("empty");
    }
  });
});

describe("website and text payloads", () => {
  it("keeps the URL, query, and fragment exactly", () => {
    const url = "https://example.com/a?b=1&c=hello%20world#frag/x";
    const result = readyPayload("url", { url: `  ${url}  ` });
    expect(result.payload).toBe(url);
    expect(result.payload.includes("expires")).toBe(false);
  });

  it("rejects script and data URLs", () => {
    expect(buildPayload("url", { url: "javascript:alert(1)" }).status).toBe("invalid");
    expect(buildPayload("url", { url: "data:text/html,hi" }).status).toBe("invalid");
  });

  it("preserves Unicode and markup characters in text", () => {
    const text = "  こんにちは <tag> & \"quotes\"  ";
    const result = readyPayload("text", { text });
    expect(result.payload).toBe(text);
  });

  it("refuses to shorten a payload that exceeds QR capacity", () => {
    const text = "あ".repeat(2000);
    const built = buildPayload("text", { text });
    const result = finalizePayload(built, "H");
    expect(result.status).toBe("invalid");
    if (result.status === "invalid") {
      expect(result.formError).toMatch(/Nothing was shortened/);
      expect(result.formError).not.toContain(text.slice(0, 20));
    }
  });
});

describe("contact payloads", () => {
  it("builds a mailto link with an encoded subject and body", () => {
    const result = readyPayload("email", {
      email: "ada@example.com",
      subject: "Hello & bye",
      body: "Line 1\nLine 2",
    });
    expect(result.payload).toBe(
      "mailto:ada@example.com?subject=Hello%20%26%20bye&body=Line%201%0ALine%202",
    );
  });

  it("requires an email address when a subject is present", () => {
    const result = buildPayload("email", { email: "", subject: "Hello", body: "" });
    expect(result.status).toBe("invalid");
    if (result.status === "invalid") {
      expect(result.fieldErrors.email).toBeTruthy();
    }
  });

  it("normalizes a phone number without adding a country code", () => {
    const result = readyPayload("phone", { phone: "+44 7700 900123" });
    expect(result.payload).toBe("tel:+447700900123");
    const local = readyPayload("phone", { phone: "07700 900123" });
    expect(local.payload).toBe("tel:07700900123");
  });

  it("turns an international 00 prefix into +", () => {
    const result = readyPayload("sms", { phone: "0044 7700 900123", message: "Hi there" });
    expect(result.payload).toBe("sms:+447700900123?body=Hi%20there");
  });

  it("builds a WhatsApp link and refuses a local leading zero", () => {
    const result = readyPayload("whatsapp", { phone: "+1 415 555 2671", message: "Hello there" });
    expect(result.payload).toBe("https://wa.me/14155552671?text=Hello%20there");
    const invalid = buildPayload("whatsapp", { phone: "07700900123", message: "" });
    expect(invalid.status).toBe("invalid");
  });

  it("formats a vCard and escapes special characters", () => {
    const result = readyPayload("vcard", {
      ...forms.vcard,
      firstName: "Ada",
      lastName: "Lovelace",
      organization: "Analytical, Engines",
      phone: "+44 1234 567890",
      email: "ada@example.com",
      website: "https://example.com",
      street: "12 Street",
      city: "London",
      country: "UK",
      note: "Line 1\nLine 2",
    });
    expect(result.payload).toBe(
      [
        "BEGIN:VCARD",
        "VERSION:3.0",
        "N:Lovelace;Ada;;;",
        "FN:Ada Lovelace",
        "ORG:Analytical\\, Engines",
        "TEL;TYPE=CELL:+441234567890",
        "EMAIL:ada@example.com",
        "URL:https://example.com",
        "ADR;TYPE=HOME:;;12 Street;London;;;UK",
        "NOTE:Line 1\\nLine 2",
        "END:VCARD",
      ].join("\r\n"),
    );
  });

  it("folds a long vCard line and does not accept a title alone", () => {
    const note = "N".repeat(90);
    const result = readyPayload("vcard", { ...forms.vcard, firstName: "Ada", note });
    expect(result.payload).toContain("\r\n ");
    const titleOnly = buildPayload("vcard", { ...forms.vcard, title: "Engineer" });
    expect(titleOnly.status).toBe("invalid");
  });
});

describe("wifi payloads", () => {
  it("escapes special characters and marks a hidden network", () => {
    const result = readyPayload("wifi", {
      ssid: "Cafe;Net",
      password: "p:a\\ss",
      encryption: "WPA",
      hidden: true,
    });
    expect(result.payload).toBe("WIFI:T:WPA;S:Cafe\\;Net;P:p\\:a\\\\ss;H:true;;");
  });

  it("requires a password unless the network is open", () => {
    const missing = buildPayload("wifi", {
      ssid: "Studio",
      password: "",
      encryption: "WPA",
      hidden: false,
    });
    expect(missing.status).toBe("invalid");
    const open = readyPayload("wifi", {
      ssid: "Studio",
      password: "",
      encryption: "nopass",
      hidden: false,
    });
    expect(open.payload).toBe("WIFI:T:nopass;S:Studio;P:;H:false;;");
  });

  it("does not drop a password when the network is marked open", () => {
    const result = buildPayload("wifi", {
      ssid: "Studio",
      password: "secret",
      encryption: "nopass",
      hidden: false,
    });
    expect(result.status).toBe("invalid");
  });
});

describe("location, social, and app payloads", () => {
  it("encodes coordinates as a geo URI without a website", () => {
    const result = readyPayload("location", {
      ...forms.location,
      latitude: "51.5074",
      longitude: "-0.1278",
      linkStyle: "geo",
    });
    expect(result.payload).toBe("geo:51.5074,-0.1278");
  });

  it("keeps a Unicode address inside a Google Maps URL", () => {
    const result = readyPayload("location", {
      ...forms.location,
      mode: "address",
      address: "東京都渋谷区",
    });
    const query = new URL(result.payload).searchParams.get("query");
    expect(query).toBe("東京都渋谷区");
    expect(result.notices.some((notice) => notice.text.includes("Google"))).toBe(true);
  });

  it("builds a social profile and also accepts a full URL", () => {
    const profile = readyPayload("social", { platform: "github", username: "@octocat" });
    expect(profile.payload).toBe("https://github.com/octocat");
    const custom = readyPayload("social", {
      platform: "instagram",
      username: "https://example.com/a?b=1#c",
    });
    expect(custom.payload).toBe("https://example.com/a?b=1#c");
  });

  it("builds store links without dropping a pasted URL", () => {
    const apple = readyPayload("app", { store: "apple", value: "id1234567890" });
    expect(apple.payload).toBe("https://apps.apple.com/app/id1234567890");
    const play = "https://play.google.com/store/apps/details?id=com.example.app&hl=en";
    const google = readyPayload("app", { store: "google", value: play });
    expect(google.payload).toBe(play);
  });
});

describe("custom payloads", () => {
  it("stores custom text exactly and rejects an unsafe custom URL", () => {
    const text = readyPayload("custom", { mode: "text", value: "  keep spaces  " });
    expect(text.payload).toBe("  keep spaces  ");
    expect(buildPayload("custom", { mode: "url", value: "javascript:alert(1)" }).status).toBe("invalid");
  });
});
