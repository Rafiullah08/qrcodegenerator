import type { ReactNode } from "react";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 sm:text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-900";

export const labelClass = "text-sm font-medium text-slate-700 dark:text-zinc-100";

export const hintClass = "text-xs leading-5 text-zinc-500 dark:text-zinc-400";

export const errorClass = "text-sm leading-5 text-red-700 dark:text-red-400";

export const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-zinc-900";

export const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:ring-offset-zinc-900";

export const cardClass =
  "rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_rgba(15,23,42,0.04)] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none";

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  counter?: string;
  autoComplete?: string;
  inputMode?: "text" | "decimal" | "tel" | "url" | "email";
  spellCheck?: boolean;
  type?: string;
};

function FieldChrome({
  id,
  label,
  error,
  hint,
  counter,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  counter?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
        {counter ? <span className="text-xs text-zinc-400">{counter}</span> : null}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className={errorClass} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className={hintClass}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  placeholder,
  counter,
  autoComplete,
  inputMode,
  spellCheck,
  type = "text",
}: FieldProps) {
  return (
    <FieldChrome id={id} label={label} error={error} hint={hint} counter={counter}>
      <input
        id={id}
        className={inputClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        spellCheck={spellCheck}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      />
    </FieldChrome>
  );
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  placeholder,
  counter,
  rows = 4,
}: FieldProps & { rows?: number }) {
  return (
    <FieldChrome id={id} label={label} error={error} hint={hint} counter={counter}>
      <textarea
        id={id}
        className={`${inputClass} resize-y`}
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        spellCheck
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      />
    </FieldChrome>
  );
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  hint,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <FieldChrome id={id} label={label} hint={hint}>
      <select
        id={id}
        className={inputClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </FieldChrome>
  );
}

export function ChoiceGroup<T extends string>({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string;
  name: string;
  value: T;
  options: { value: T; label: string; hint?: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className={labelClass}>{label}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <label
              key={option.value}
              className={cx(
                "cursor-pointer rounded-lg border px-3 py-2.5 text-sm transition focus-within:ring-2 focus-within:ring-indigo-500",
                selected
                  ? "border-indigo-600 bg-indigo-50 text-indigo-950 dark:border-indigo-400 dark:bg-indigo-950/50 dark:text-indigo-50"
                  : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100",
              )}
            >
              <input
                type="radio"
                className="sr-only"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
              />
              <span className="font-medium">{option.label}</span>
              {option.hint ? (
                <span className={cx("mt-0.5 block text-xs font-normal", selected ? "text-indigo-800/80 dark:text-indigo-200" : "text-slate-500 dark:text-zinc-400")}>
                  {option.hint}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
