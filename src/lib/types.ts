export const QR_TYPES = [
  "url",
  "text",
  "email",
  "phone",
  "sms",
  "wifi",
  "vcard",
  "whatsapp",
  "location",
  "payment-link",
  "payment-details",
  "social",
  "app",
  "custom",
] as const;

export type QrType = (typeof QR_TYPES)[number];

export type SocialPlatform =
  | "instagram"
  | "x"
  | "facebook"
  | "linkedin"
  | "youtube"
  | "tiktok"
  | "github"
  | "telegram"
  | "custom";

export type DotStyle =
  | "square"
  | "rounded"
  | "dots"
  | "classy"
  | "classy-rounded"
  | "extra-rounded";

export type CornerStyle = "square" | "extra-rounded" | "dot";

export type CornerDotStyle = "square" | "dot";

export type ErrorCorrection = "L" | "M" | "Q" | "H";

export type ExportFormat = "png" | "svg" | "pdf";

export type ExportSize = 1024 | 2048 | 4096;

export type Notice = {
  tone: "info" | "warning";
  text: string;
};

export type BuildResult =
  | { status: "empty"; message: string }
  | { status: "invalid"; fieldErrors: Record<string, string>; formError?: string }
  | { status: "ready"; payload: string; suggestedName: string; notices: Notice[] };

export type QrStyle = {
  foreground: string;
  background: string;
  dots: DotStyle;
  corners: CornerStyle;
  cornerDots: CornerDotStyle;
  margin: number;
  exportSize: ExportSize;
  errorCorrection: ErrorCorrection;
  logoDataUrl: string | null;
  logoName: string | null;
};

export type FormMap = {
  url: { url: string };
  text: { text: string };
  email: { email: string; subject: string; body: string };
  phone: { phone: string };
  sms: { phone: string; message: string };
  wifi: {
    ssid: string;
    password: string;
    encryption: "WPA" | "WEP" | "nopass";
    hidden: boolean;
  };
  vcard: {
    firstName: string;
    lastName: string;
    organization: string;
    title: string;
    phone: string;
    email: string;
    website: string;
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
    note: string;
  };
  whatsapp: { phone: string; message: string };
  location: {
    mode: "coordinates" | "address" | "url";
    latitude: string;
    longitude: string;
    address: string;
    url: string;
    linkStyle: "geo" | "google";
  };
  "payment-link": { url: string };
  "payment-details": {
    method: "sepa" | "upi" | "bitcoin" | "custom";
    sepaName: string;
    sepaIban: string;
    sepaBic: string;
    sepaAmount: string;
    sepaPurpose: string;
    sepaRemittance: string;
    upiVpa: string;
    upiName: string;
    upiAmount: string;
    upiNote: string;
    btcAddress: string;
    btcAmount: string;
    btcLabel: string;
    btcMessage: string;
    customPayload: string;
  };
  social: { platform: SocialPlatform; username: string };
  app: { store: "apple" | "google" | "custom"; value: string };
  custom: { mode: "url" | "text"; value: string };
};

export type FormsState = { [K in QrType]: FormMap[K] };

export type HistoryEntry = {
  id: string;
  createdAt: string;
  type: QrType;
  name: string;
  payload: string;
  fields: FormMap[QrType];
  style: QrStyle;
};

export const TYPE_GROUPS: { id: string; label: string; types: QrType[] }[] = [
  { id: "content", label: "Link and text", types: ["url", "text", "custom"] },
  {
    id: "contact",
    label: "Contact",
    types: ["email", "phone", "sms", "whatsapp", "vcard"],
  },
  { id: "place", label: "Network and place", types: ["wifi", "location"] },
  { id: "pay", label: "Payment", types: ["payment-link", "payment-details"] },
  { id: "profiles", label: "Profiles and apps", types: ["social", "app"] },
];

export const TYPE_META: Record<QrType, { label: string; description: string }> = {
  url: {
    label: "Website",
    description: "Encode a web address exactly as you type it.",
  },
  text: {
    label: "Plain text",
    description: "Encode any text, including accents and other languages.",
  },
  email: {
    label: "Email",
    description: "Open a new message to an address, with an optional subject and body.",
  },
  phone: {
    label: "Phone",
    description: "Start a call to a phone number.",
  },
  sms: {
    label: "SMS",
    description: "Open a text message, with an optional draft.",
  },
  wifi: {
    label: "Wi-Fi",
    description: "Share a network name and password. Anyone with the image can join.",
  },
  vcard: {
    label: "Contact card",
    description: "Share a contact that phones can save.",
  },
  whatsapp: {
    label: "WhatsApp",
    description: "Open a WhatsApp chat with a phone number.",
  },
  location: {
    label: "Location",
    description: "Share coordinates, an address search, or an existing maps link.",
  },
  "payment-link": {
    label: "Payment link",
    description: "Store a checkout or payment page URL inside the code.",
  },
  "payment-details": {
    label: "Payment details",
    description: "Store bank or wallet details using a published format.",
  },
  social: {
    label: "Social profile",
    description: "Link to a profile on a social network.",
  },
  app: {
    label: "App download",
    description: "Link to an app store listing or a direct download URL.",
  },
  custom: {
    label: "Custom",
    description: "Encode a URL or any exact text you provide.",
  },
};

export const COLOR_PRESETS: { name: string; foreground: string; background: string }[] = [
  { name: "Ink", foreground: "#111827", background: "#ffffff" },
  { name: "Slate", foreground: "#1e293b", background: "#f8fafc" },
  { name: "Teal", foreground: "#115e59", background: "#f0fdfa" },
  { name: "Navy", foreground: "#1e3a5f", background: "#ffffff" },
  { name: "Forest", foreground: "#14532d", background: "#f7fee7" },
  { name: "Wine", foreground: "#7f1d1d", background: "#fff7f7" },
];

export const DOT_STYLES: { value: DotStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "dots", label: "Dots" },
  { value: "classy", label: "Classy" },
  { value: "classy-rounded", label: "Classy rounded" },
  { value: "extra-rounded", label: "Extra rounded" },
];

export const CORNER_STYLES: { value: CornerStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "extra-rounded", label: "Extra rounded" },
  { value: "dot", label: "Dot" },
];

export const CORNER_DOT_STYLES: { value: CornerDotStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "dot", label: "Dot" },
];

export const ERROR_CORRECTION_OPTIONS: { value: ErrorCorrection; label: string }[] = [
  { value: "L", label: "Low · about 7% recovery" },
  { value: "M", label: "Medium · about 15% recovery" },
  { value: "Q", label: "Quartile · about 25% recovery" },
  { value: "H", label: "High · about 30% recovery" },
];

export const EXPORT_SIZES: ExportSize[] = [1024, 2048, 4096];

export const PREVIEW_SIZE = 280;

export const SENSITIVE_TYPES: ReadonlySet<QrType> = new Set([
  "wifi",
  "payment-link",
  "payment-details",
]);
