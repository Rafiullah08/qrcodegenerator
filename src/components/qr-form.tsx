"use client";

import { ChoiceGroup, TextAreaField, TextField } from "@/components/ui";
import type { FormMap, FormsState, QrType } from "@/lib/types";
import { TYPE_META } from "@/lib/types";
import { useState, type Ref } from "react";

type QrFormProps = {
  type: QrType;
  forms: FormsState;
  errors: Record<string, string>;
  headingRef: Ref<HTMLHeadingElement>;
  onChange: (field: string, value: string | boolean) => void;
  onBlur: (field: string) => void;
  onSubmit: () => void;
};

export function QrForm({ type, forms, errors, headingRef, onChange, onBlur, onSubmit }: QrFormProps) {
  const meta = TYPE_META[type];
  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div>
        <h2 ref={headingRef} tabIndex={-1} className="text-lg font-semibold tracking-tight text-slate-900 outline-none dark:text-zinc-50">
          {meta.label}
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-zinc-400">{meta.description}</p>
      </div>
      <Fields type={type} forms={forms} errors={errors} onChange={onChange} onBlur={onBlur} />
      <button type="submit" className="sr-only">
        Check fields
      </button>
    </form>
  );
}

function Fields({ type, forms, errors, onChange, onBlur }: Omit<QrFormProps, "headingRef" | "onSubmit">) {
  const id = (field: string) => `${type}-${field}`;
  const set = (field: string) => (value: string) => onChange(field, value);
  const blur = (field: string) => () => onBlur(field);

  if (type === "url") {
    const fields = forms.url;
    return (
      <TextField
        id={id("url")}
        label="Website URL"
        value={fields.url}
        onChange={set("url")}
        onBlur={blur("url")}
        error={errors.url}
        placeholder="https://example.com/docs?topic=qr#start"
        hint="Include https://. Query parameters and the #fragment are kept as entered."
        autoComplete="url"
        inputMode="url"
        spellCheck={false}
      />
    );
  }

  if (type === "text") {
    const fields = forms.text;
    return (
      <TextAreaField
        id={id("text")}
        label="Text"
        value={fields.text}
        onChange={set("text")}
        onBlur={blur("text")}
        error={errors.text}
        placeholder="Hello, こんにちは"
        hint="The text is encoded exactly, including accents and symbols."
      />
    );
  }

  if (type === "email") {
    const fields = forms.email;
    return (
      <div className="space-y-4">
        <TextField
          id={id("email")}
          label="Email address"
          type="email"
          value={fields.email}
          onChange={set("email")}
          onBlur={blur("email")}
          error={errors.email}
          placeholder="ada@example.com"
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
        />
        <TextField
          id={id("subject")}
          label="Subject"
          value={fields.subject}
          onChange={set("subject")}
          onBlur={blur("subject")}
          placeholder="Optional"
        />
        <TextAreaField
          id={id("body")}
          label="Message"
          value={fields.body}
          onChange={set("body")}
          onBlur={blur("body")}
          placeholder="Optional"
          rows={4}
        />
      </div>
    );
  }

  if (type === "phone") {
    return (
      <TextField
        id={id("phone")}
        label="Phone number"
        value={forms.phone.phone}
        onChange={set("phone")}
        onBlur={blur("phone")}
        error={errors.phone}
        placeholder="+1 415 555 2671"
        hint="Spaces and dashes are removed. A leading 00 becomes +."
        autoComplete="tel"
        inputMode="tel"
        spellCheck={false}
      />
    );
  }

  if (type === "sms") {
    const fields = forms.sms;
    return (
      <div className="space-y-4">
        <TextField
          id={id("phone")}
          label="Phone number"
          value={fields.phone}
          onChange={set("phone")}
          onBlur={blur("phone")}
          error={errors.phone}
          placeholder="+1 415 555 2671"
          autoComplete="tel"
          inputMode="tel"
          spellCheck={false}
        />
        <TextAreaField
          id={id("message")}
          label="Message"
          value={fields.message}
          onChange={set("message")}
          onBlur={blur("message")}
          placeholder="Optional draft"
          rows={3}
        />
      </div>
    );
  }

  if (type === "wifi") {
    return <WifiFields fields={forms.wifi} errors={errors} onChange={onChange} onBlur={onBlur} />;
  }

  if (type === "vcard") {
    return <VCardFields fields={forms.vcard} errors={errors} onChange={onChange} onBlur={onBlur} />;
  }

  if (type === "whatsapp") {
    const fields = forms.whatsapp;
    return (
      <div className="space-y-4">
        <TextField
          id={id("phone")}
          label="Phone number"
          value={fields.phone}
          onChange={set("phone")}
          onBlur={blur("phone")}
          error={errors.phone}
          placeholder="14155552671"
          hint="Include the country code, without a leading + or 0."
          inputMode="tel"
          spellCheck={false}
        />
        <TextAreaField
          id={id("message")}
          label="Message"
          value={fields.message}
          onChange={set("message")}
          onBlur={blur("message")}
          placeholder="Optional"
          rows={3}
        />
      </div>
    );
  }

  if (type === "location") {
    return <LocationFields fields={forms.location} errors={errors} onChange={onChange} onBlur={onBlur} />;
  }

  if (type === "payment-link") {
    return (
      <TextField
        id={id("url")}
        label="Payment or checkout URL"
        value={forms["payment-link"].url}
        onChange={set("url")}
        onBlur={blur("url")}
        error={errors.url}
        placeholder="https://pay.example.com/checkout/order-1001"
        hint="Paste the official link from your provider. It is stored exactly, with no short link added."
        inputMode="url"
        spellCheck={false}
        autoComplete="off"
      />
    );
  }

  if (type === "payment-details") {
    return (
      <PaymentFields fields={forms["payment-details"]} errors={errors} onChange={onChange} onBlur={onBlur} />
    );
  }

  if (type === "social") {
    return <SocialFields fields={forms.social} errors={errors} onChange={onChange} onBlur={onBlur} />;
  }

  if (type === "app") {
    return <AppFields fields={forms.app} errors={errors} onChange={onChange} onBlur={onBlur} />;
  }

  const fields = forms.custom;
  return (
    <div className="space-y-4">
      <ChoiceGroup
        label="What should the code contain?"
        name="custom-mode"
        value={fields.mode}
        onChange={(value) => onChange("mode", value)}
        options={[
          { value: "url", label: "URL" },
          { value: "text", label: "Exact text" },
        ]}
      />
      {fields.mode === "url" ? (
        <TextField
          id={id("value")}
          label="URL"
          value={fields.value}
          onChange={set("value")}
          onBlur={blur("value")}
          error={errors.value}
          placeholder="https://example.com/path?id=1#section"
          inputMode="url"
          spellCheck={false}
        />
      ) : (
        <TextAreaField
          id={id("value")}
          label="Text"
          value={fields.value}
          onChange={set("value")}
          onBlur={blur("value")}
          error={errors.value}
          hint="Encoded exactly as entered."
        />
      )}
    </div>
  );
}

function WifiFields({
  fields,
  errors,
  onChange,
  onBlur,
}: {
  fields: FormMap["wifi"];
  errors: Record<string, string>;
  onChange: QrFormProps["onChange"];
  onBlur: QrFormProps["onBlur"];
}) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="space-y-4">
      <TextField
        id="wifi-ssid"
        label="Network name"
        value={fields.ssid}
        onChange={(value) => onChange("ssid", value)}
        onBlur={() => onBlur("ssid")}
        error={errors.ssid}
        placeholder="Studio-Guest"
        spellCheck={false}
        autoComplete="off"
      />
      <ChoiceGroup
        label="Encryption"
        name="wifi-encryption"
        value={fields.encryption}
        onChange={(value) => onChange("encryption", value)}
        options={[
          { value: "WPA", label: "WPA / WPA2 / WPA3" },
          { value: "WEP", label: "WEP" },
          { value: "nopass", label: "No password" },
        ]}
      />
      {fields.encryption === "nopass" ? null : (
        <div className="space-y-1.5">
          <TextField
            id="wifi-password"
            label="Password"
            type={showPassword ? "text" : "password"}
            value={fields.password}
            onChange={(value) => onChange("password", value)}
            onBlur={() => onBlur("password")}
            error={errors.password}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-300"
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? "Hide password" : "Show password"}
          </button>
        </div>
      )}
      <label className="flex items-start gap-3 text-sm text-zinc-800 dark:text-zinc-100">
        <input
          type="checkbox"
          className="mt-0.5 size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          checked={fields.hidden}
          onChange={(event) => onChange("hidden", event.target.checked)}
        />
        <span>
          <span className="font-medium">Hidden network</span>
          <span className="mt-0.5 block text-xs font-normal text-zinc-500 dark:text-zinc-400">
            The network name is not broadcast.
          </span>
        </span>
      </label>
    </div>
  );
}

function VCardFields({
  fields,
  errors,
  onChange,
  onBlur,
}: {
  fields: FormMap["vcard"];
  errors: Record<string, string>;
  onChange: QrFormProps["onChange"];
  onBlur: QrFormProps["onBlur"];
}) {
  const text = (field: keyof FormMap["vcard"], label: string, placeholder?: string) => (
    <TextField
      id={`vcard-${field}`}
      label={label}
      value={fields[field]}
      onChange={(value) => onChange(field, value)}
      onBlur={() => onBlur(field)}
      error={errors[field]}
      placeholder={placeholder}
    />
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {text("firstName", "First name", "Ada")}
        {text("lastName", "Last name", "Lovelace")}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {text("organization", "Organization")}
        {text("title", "Title")}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="vcard-phone"
          label="Phone"
          value={fields.phone}
          onChange={(value) => onChange("phone", value)}
          onBlur={() => onBlur("phone")}
          error={errors.phone}
          inputMode="tel"
          autoComplete="tel"
          spellCheck={false}
        />
        <TextField
          id="vcard-email"
          label="Email"
          value={fields.email}
          onChange={(value) => onChange("email", value)}
          onBlur={() => onBlur("email")}
          error={errors.email}
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
        />
      </div>
      {text("website", "Website")}
      <div className="grid gap-4 sm:grid-cols-2">
        {text("street", "Street")}
        {text("city", "City")}
        {text("region", "Region")}
        {text("postalCode", "Postal code")}
      </div>
      {text("country", "Country")}
      <TextAreaField
        id="vcard-note"
        label="Note"
        value={fields.note}
        onChange={(value) => onChange("note", value)}
        onBlur={() => onBlur("note")}
        rows={3}
      />
    </div>
  );
}

function LocationFields({
  fields,
  errors,
  onChange,
  onBlur,
}: {
  fields: FormMap["location"];
  errors: Record<string, string>;
  onChange: QrFormProps["onChange"];
  onBlur: QrFormProps["onBlur"];
}) {
  return (
    <div className="space-y-4">
      <ChoiceGroup
        label="Location format"
        name="location-mode"
        value={fields.mode}
        onChange={(value) => onChange("mode", value)}
        options={[
          { value: "coordinates", label: "Coordinates", hint: "A geo: link, or a Google Maps link." },
          { value: "address", label: "Address search", hint: "Opens a Google Maps search." },
          { value: "url", label: "Existing maps URL", hint: "Stored exactly as pasted." },
        ]}
      />
      {fields.mode === "coordinates" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="location-latitude"
              label="Latitude"
              value={fields.latitude}
              onChange={(value) => onChange("latitude", value)}
              onBlur={() => onBlur("latitude")}
              error={errors.latitude}
              placeholder="51.5074"
              inputMode="decimal"
              spellCheck={false}
            />
            <TextField
              id="location-longitude"
              label="Longitude"
              value={fields.longitude}
              onChange={(value) => onChange("longitude", value)}
              onBlur={() => onBlur("longitude")}
              error={errors.longitude}
              placeholder="-0.1278"
              inputMode="decimal"
              spellCheck={false}
            />
          </div>
          <ChoiceGroup
            label="Link style"
            name="location-style"
            value={fields.linkStyle}
            onChange={(value) => onChange("linkStyle", value)}
            options={[
              { value: "geo", label: "geo: location", hint: "No website is required to read the coordinates." },
              { value: "google", label: "Google Maps", hint: "Depends on Google Maps staying available." },
            ]}
          />
        </>
      ) : null}
      {fields.mode === "address" ? (
        <TextField
          id="location-address"
          label="Address or place"
          value={fields.address}
          onChange={(value) => onChange("address", value)}
          onBlur={() => onBlur("address")}
          error={errors.address}
          placeholder="10 Downing Street, London"
        />
      ) : null}
      {fields.mode === "url" ? (
        <TextField
          id="location-url"
          label="Maps URL"
          value={fields.url}
          onChange={(value) => onChange("url", value)}
          onBlur={() => onBlur("url")}
          error={errors.url}
          placeholder="https://maps.google.com/?q=London"
          inputMode="url"
          spellCheck={false}
        />
      ) : null}
    </div>
  );
}

function PaymentFields({
  fields,
  errors,
  onChange,
  onBlur,
}: {
  fields: FormMap["payment-details"];
  errors: Record<string, string>;
  onChange: QrFormProps["onChange"];
  onBlur: QrFormProps["onBlur"];
}) {
  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm leading-6 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
        SEPA transfers, UPI, and Bitcoin have published formats, so they can be encoded here. Other banks and wallets often use their own QR layouts. If yours is not listed, use Payment link or paste the official payload. Scanning a code does not move money.
      </p>
      <ChoiceGroup
        label="Payment format"
        name="payment-method"
        value={fields.method}
        onChange={(value) => onChange("method", value)}
        options={[
          { value: "sepa", label: "SEPA transfer", hint: "Euro credit transfer, EPC QR." },
          { value: "upi", label: "UPI", hint: "India. Amounts are in INR." },
          { value: "bitcoin", label: "Bitcoin", hint: "BIP-21 address." },
          { value: "custom", label: "Official payload", hint: "Paste the exact text from your provider." },
        ]}
      />
      {fields.method === "sepa" ? (
        <div className="space-y-4">
          <TextField
            id="sepa-name"
            label="Account holder"
            value={fields.sepaName}
            onChange={(value) => onChange("sepaName", value)}
            onBlur={() => onBlur("sepaName")}
            error={errors.sepaName}
            counter={`${fields.sepaName.trim().length}/70`}
            autoComplete="name"
          />
          <TextField
            id="sepa-iban"
            label="IBAN"
            value={fields.sepaIban}
            onChange={(value) => onChange("sepaIban", value)}
            onBlur={() => onBlur("sepaIban")}
            error={errors.sepaIban}
            placeholder="DE89 3704 0044 0532 0130 00"
            spellCheck={false}
            autoComplete="off"
          />
          <TextField
            id="sepa-bic"
            label="BIC"
            value={fields.sepaBic}
            onChange={(value) => onChange("sepaBic", value)}
            onBlur={() => onBlur("sepaBic")}
            error={errors.sepaBic}
            hint="Optional for this QR version."
            spellCheck={false}
            autoComplete="off"
          />
          <TextField
            id="sepa-amount"
            label="Amount in EUR"
            value={fields.sepaAmount}
            onChange={(value) => onChange("sepaAmount", value)}
            onBlur={() => onBlur("sepaAmount")}
            error={errors.sepaAmount}
            placeholder="12.50"
            hint="Leave blank if the payer should choose the amount. This format is euro only."
            inputMode="decimal"
            autoComplete="off"
          />
          <TextField
            id="sepa-purpose"
            label="Purpose code"
            value={fields.sepaPurpose}
            onChange={(value) => onChange("sepaPurpose", value)}
            onBlur={() => onBlur("sepaPurpose")}
            error={errors.sepaPurpose}
            placeholder="GDDS"
            hint="Optional 4-letter code. Leave blank if you do not have one."
            spellCheck={false}
            autoComplete="off"
          />
          <TextField
            id="sepa-remittance"
            label="Payment reference"
            value={fields.sepaRemittance}
            onChange={(value) => onChange("sepaRemittance", value)}
            onBlur={() => onBlur("sepaRemittance")}
            error={errors.sepaRemittance}
            counter={`${fields.sepaRemittance.trim().length}/140`}
            autoComplete="off"
          />
        </div>
      ) : null}
      {fields.method === "upi" ? (
        <div className="space-y-4">
          <TextField
            id="upi-vpa"
            label="UPI ID"
            value={fields.upiVpa}
            onChange={(value) => onChange("upiVpa", value)}
            onBlur={() => onBlur("upiVpa")}
            error={errors.upiVpa}
            placeholder="shop@okbank"
            spellCheck={false}
            autoComplete="off"
          />
          <TextField
            id="upi-name"
            label="Payee name"
            value={fields.upiName}
            onChange={(value) => onChange("upiName", value)}
            onBlur={() => onBlur("upiName")}
            error={errors.upiName}
            counter={`${fields.upiName.trim().length}/50`}
            autoComplete="off"
          />
          <TextField
            id="upi-amount"
            label="Amount in INR"
            value={fields.upiAmount}
            onChange={(value) => onChange("upiAmount", value)}
            onBlur={() => onBlur("upiAmount")}
            error={errors.upiAmount}
            placeholder="100.00"
            hint="Optional. Currency is INR."
            inputMode="decimal"
            autoComplete="off"
          />
          <TextField
            id="upi-note"
            label="Note"
            value={fields.upiNote}
            onChange={(value) => onChange("upiNote", value)}
            onBlur={() => onBlur("upiNote")}
            error={errors.upiNote}
            counter={`${fields.upiNote.trim().length}/80`}
            autoComplete="off"
          />
        </div>
      ) : null}
      {fields.method === "bitcoin" ? (
        <div className="space-y-4">
          <TextField
            id="btc-address"
            label="Bitcoin address"
            value={fields.btcAddress}
            onChange={(value) => onChange("btcAddress", value)}
            onBlur={() => onBlur("btcAddress")}
            error={errors.btcAddress}
            placeholder="bc1q..."
            spellCheck={false}
            autoComplete="off"
          />
          <TextField
            id="btc-amount"
            label="Amount in BTC"
            value={fields.btcAmount}
            onChange={(value) => onChange("btcAmount", value)}
            onBlur={() => onBlur("btcAmount")}
            error={errors.btcAmount}
            placeholder="0.005"
            hint="Optional. This is bitcoin, not a national currency."
            inputMode="decimal"
            autoComplete="off"
          />
          <TextField
            id="btc-label"
            label="Label"
            value={fields.btcLabel}
            onChange={(value) => onChange("btcLabel", value)}
            onBlur={() => onBlur("btcLabel")}
            error={errors.btcLabel}
            autoComplete="off"
          />
          <TextField
            id="btc-message"
            label="Message"
            value={fields.btcMessage}
            onChange={(value) => onChange("btcMessage", value)}
            onBlur={() => onBlur("btcMessage")}
            error={errors.btcMessage}
            autoComplete="off"
          />
        </div>
      ) : null}
      {fields.method === "custom" ? (
        <TextAreaField
          id="payment-custom"
          label="Official payment payload"
          value={fields.customPayload}
          onChange={(value) => onChange("customPayload", value)}
          onBlur={() => onBlur("customPayload")}
          error={errors.customPayload}
          hint="Paste the exact text from your bank or wallet. It is stored as entered."
          rows={5}
        />
      ) : null}
    </div>
  );
}

function SocialFields({
  fields,
  errors,
  onChange,
  onBlur,
}: {
  fields: FormMap["social"];
  errors: Record<string, string>;
  onChange: QrFormProps["onChange"];
  onBlur: QrFormProps["onBlur"];
}) {
  return (
    <div className="space-y-4">
      <ChoiceGroup
        label="Network"
        name="social-platform"
        value={fields.platform}
        onChange={(value) => onChange("platform", value)}
        options={[
          { value: "instagram", label: "Instagram" },
          { value: "x", label: "X" },
          { value: "facebook", label: "Facebook" },
          { value: "linkedin", label: "LinkedIn" },
          { value: "youtube", label: "YouTube" },
          { value: "tiktok", label: "TikTok" },
          { value: "github", label: "GitHub" },
          { value: "telegram", label: "Telegram" },
          { value: "custom", label: "Other URL" },
        ]}
      />
      <TextField
        id="social-username"
        label={fields.platform === "custom" ? "Profile URL" : "Username or profile URL"}
        value={fields.username}
        onChange={(value) => onChange("username", value)}
        onBlur={() => onBlur("username")}
        error={errors.username}
        placeholder={fields.platform === "custom" ? "https://example.com/your-name" : "@yourname"}
        spellCheck={false}
      />
    </div>
  );
}

function AppFields({
  fields,
  errors,
  onChange,
  onBlur,
}: {
  fields: FormMap["app"];
  errors: Record<string, string>;
  onChange: QrFormProps["onChange"];
  onBlur: QrFormProps["onBlur"];
}) {
  const placeholder =
    fields.store === "apple"
      ? "1234567890 or an App Store URL"
      : fields.store === "google"
        ? "com.example.app or a Play Store URL"
        : "https://example.com/app.apk";
  return (
    <div className="space-y-4">
      <ChoiceGroup
        label="Store"
        name="app-store"
        value={fields.store}
        onChange={(value) => onChange("store", value)}
        options={[
          { value: "apple", label: "App Store" },
          { value: "google", label: "Google Play" },
          { value: "custom", label: "Direct URL" },
        ]}
      />
      <TextField
        id="app-value"
        label={fields.store === "custom" ? "Download URL" : "App id or URL"}
        value={fields.value}
        onChange={(value) => onChange("value", value)}
        onBlur={() => onBlur("value")}
        error={errors.value}
        placeholder={placeholder}
        spellCheck={false}
      />
    </div>
  );
}
