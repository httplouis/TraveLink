"use client";

import * as React from "react";
import clsx from "clsx";

type BaseProps = {
  id?: string;
  label: string;
  placeholder?: string;
  value?: string | number | null;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  error?: string;
  required?: boolean;
  helper?: string;
  className?: string;
  disabled?: boolean;
};

function FieldWrap({
  label,
  error,
  helper,
  required,
  children,
}: React.PropsWithChildren<{
  label: string;
  error?: string;
  helper?: string;
  required?: boolean;
}>) {
  return (
    <label className="grid gap-1">
      <span className="text-[13px] font-medium text-neutral-700">
        {label} {required && <span className="text-rose-600">*</span>}
      </span>
      {children}
      {error ? (
        <span className="text-xs text-rose-600">{error}</span>
      ) : helper ? (
        <span className="text-xs text-neutral-500">{helper}</span>
      ) : null}
    </label>
  );
}

export function TextInput({
  id,
  label,
  placeholder,
  value,
  onChange,
  error,
  required,
  helper,
  className,
  disabled,
}: BaseProps) {
  return (
    <FieldWrap label={label} error={error} helper={helper} required={required}>
      <input
        id={id}
        className={clsx(
          "h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none",
          "placeholder:text-neutral-400",
          error
            ? "border-rose-500 ring-2 ring-rose-100"
            : "border-neutral-300 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200",
          disabled && "bg-neutral-100 text-neutral-500",
          className
        )}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={onChange as any}
        disabled={disabled}
      />
    </FieldWrap>
  );
}

/** Date input with opaque placeholder styling */
export function DateInput({
  id,
  label,
  placeholder = "mm/dd/yyyy",
  value,
  onChange,
  error,
  required,
  helper,
  className,
  disabled,
}: BaseProps) {
  const isEmpty = !value;

  return (
    <FieldWrap label={label} error={error} helper={helper} required={required}>
      <style jsx global>{`
        input[type='date'][data-empty='true']::-webkit-datetime-edit,
        input[type='date'][data-empty='true']::-webkit-datetime-edit-text,
        input[type='date'][data-empty='true']::-webkit-datetime-edit-month-field,
        input[type='date'][data-empty='true']::-webkit-datetime-edit-day-field,
        input[type='date'][data-empty='true']::-webkit-datetime-edit-year-field {
          color: #111827;
          opacity: 1 !important;
        }
        input[type='date']::-webkit-calendar-picker-indicator {
          opacity: 0.9;
        }
        input[type='date'][data-empty='true'] {
          color: #111827;
        }
      `}</style>

      <input
        id={id}
        type="date"
        data-empty={isEmpty ? "true" : "false"}
        className={clsx(
          "h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none",
          error
            ? "border-rose-500 ring-2 ring-rose-100"
            : "border-neutral-300 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200",
          disabled && "bg-neutral-100 text-neutral-500",
          className
        )}
        placeholder={placeholder}
        value={(value as string) ?? ""}
        onChange={onChange as any}
        disabled={disabled}
      />
    </FieldWrap>
  );
}

type TextAreaProps = BaseProps & { rows?: number };

export function TextArea({
  id,
  label,
  placeholder,
  value,
  onChange,
  error,
  required,
  helper,
  className,
  disabled,
  rows = 6,
}: TextAreaProps) {
  return (
    <FieldWrap label={label} error={error} helper={helper} required={required}>
      <textarea
        id={id}
        rows={rows}
        className={clsx(
          "w-full resize-y rounded-xl border bg-white px-3 py-2 text-sm outline-none",
          "placeholder:text-neutral-400",
          error
            ? "border-rose-500 ring-2 ring-rose-100"
            : "border-neutral-300 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200",
          disabled && "bg-neutral-100 text-neutral-500",
          className
        )}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={onChange as any}
        disabled={disabled}
      />
    </FieldWrap>
  );
}

export function CurrencyInput({
  id,
  label,
  placeholder = "0.00",
  value,
  onChange,
  error,
  required,
  helper,
  className,
  disabled,
}: BaseProps) {
  return (
    <FieldWrap label={label} error={error} helper={helper} required={required}>
      <div
        className={clsx(
          "flex h-10 items-center rounded-xl border bg-white text-sm",
          error
            ? "border-rose-500 ring-2 ring-rose-100"
            : "border-neutral-300 focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-200",
          disabled && "bg-neutral-100 text-neutral-500",
          className
        )}
      >
        <span className="px-3 text-neutral-500">₱</span>
        <input
          id={id}
          inputMode="decimal"
          className="h-full w-full bg-transparent pr-3 outline-none placeholder:text-neutral-400"
          placeholder={placeholder}
          value={value ?? ""}
          onChange={onChange as any}
          disabled={disabled}
        />
      </div>
    </FieldWrap>
  );
}

type SelectInputProps = Omit<BaseProps, "onChange"> & {
  options: { value: string; label: string }[];
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

export function SelectInput({
  id,
  label,
  placeholder,
  value,
  onChange,
  error,
  required,
  helper,
  className,
  disabled,
  options,
}: SelectInputProps) {
  return (
    <FieldWrap label={label} error={error} helper={helper} required={required}>
      <select
        id={id}
        className={clsx(
          "h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none",
          error
            ? "border-rose-500 ring-2 ring-rose-100"
            : "border-neutral-300 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200",
          disabled && "bg-neutral-100 text-neutral-500",
          !value && "text-neutral-400",
          className
        )}
        value={value ?? ""}
        onChange={onChange as any}
        disabled={disabled}
      >
        <option value="" disabled>
          {placeholder || "Select an option"}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrap>
  );
}
