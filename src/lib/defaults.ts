import type { FormsState, QrStyle } from "@/lib/types";

export function defaultStyle(): QrStyle {
  return {
    foreground: "#111827",
    background: "#ffffff",
    dots: "square",
    corners: "square",
    cornerDots: "square",
    margin: 20,
    exportSize: 2048,
    errorCorrection: "M",
    logoDataUrl: null,
    logoName: null,
  };
}

export function defaultForms(): FormsState {
  return {
    url: { url: "" },
    text: { text: "" },
    email: { email: "", subject: "", body: "" },
    phone: { phone: "" },
    sms: { phone: "", message: "" },
    wifi: { ssid: "", password: "", encryption: "WPA", hidden: false },
    vcard: {
      firstName: "",
      lastName: "",
      organization: "",
      title: "",
      phone: "",
      email: "",
      website: "",
      street: "",
      city: "",
      region: "",
      postalCode: "",
      country: "",
      note: "",
    },
    whatsapp: { phone: "", message: "" },
    location: {
      mode: "coordinates",
      latitude: "",
      longitude: "",
      address: "",
      url: "",
      linkStyle: "geo",
    },
    "payment-link": { url: "" },
    "payment-details": {
      method: "sepa",
      sepaName: "",
      sepaIban: "",
      sepaBic: "",
      sepaAmount: "",
      sepaPurpose: "",
      sepaRemittance: "",
      upiVpa: "",
      upiName: "",
      upiAmount: "",
      upiNote: "",
      btcAddress: "",
      btcAmount: "",
      btcLabel: "",
      btcMessage: "",
      customPayload: "",
    },
    social: { platform: "instagram", username: "" },
    app: { store: "apple", value: "" },
    custom: { mode: "url", value: "" },
  };
}
