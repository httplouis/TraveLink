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
    <div className="grid gap-2 w-full">
      <label className="age-inclusive-label">
        {label} {required && <span className="text-red-600 font-bold">*</span>}
      </label>
      <div className="w-full">
        {children}
      </div>
      {error ? (
        <div className="mt-1 flex items-center gap-2 rounded-lg border-2 border-red-300 bg-red-50 px-3 py-2">
          <span className="age-inclusive-error">{error}</span>
        </div>
      ) : helper ? (
        <span className="mt-1 age-inclusive-helper">{helper}</span>
      ) : null}
    </div>
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
        data-error={error ? "true" : undefined}
        className={clsx(
          "age-inclusive-input w-full rounded-xl border-2 bg-white px-4 font-medium outline-none transition-all shadow-sm",
          "placeholder:text-gray-500",
          error
            ? "border-red-600 ring-2 ring-red-200 bg-red-50/50"
            : "border-gray-400 focus:border-[#7A0010] focus:ring-2 focus:ring-[#7A0010]/30 hover:border-gray-500",
          disabled && "bg-gray-100 text-gray-600 cursor-not-allowed",
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
        data-error={error ? "true" : undefined}
        className={clsx(
          "age-inclusive-input w-full rounded-xl border-2 bg-white px-4 font-medium outline-none transition-all shadow-sm",
          error
            ? "border-red-600 ring-2 ring-red-200 bg-red-50/50"
            : "border-gray-400 focus:border-[#7A0010] focus:ring-2 focus:ring-[#7A0010]/30 hover:border-gray-500",
          disabled && "bg-gray-100 text-gray-600 cursor-not-allowed",
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
        data-error={error ? "true" : undefined}
        className={clsx(
          "age-inclusive-input w-full resize-y rounded-xl border-2 bg-white px-4 py-3 font-medium outline-none transition-all shadow-sm",
          "placeholder:text-gray-500",
          error
            ? "border-red-600 ring-2 ring-red-200 bg-red-50/50"
            : "border-gray-400 focus:border-[#7A0010] focus:ring-2 focus:ring-[#7A0010]/30 hover:border-gray-500",
          disabled && "bg-gray-100 text-gray-600 cursor-not-allowed",
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
          "flex age-inclusive-input items-center rounded-xl border-2 bg-white transition-all shadow-sm",
          error
            ? "border-red-600 ring-2 ring-red-200 bg-red-50/50"
            : "border-gray-400 focus-within:border-[#7A0010] focus-within:ring-2 focus-within:ring-[#7A0010]/30 hover:border-gray-500",
          disabled && "bg-gray-100 text-gray-600 cursor-not-allowed",
          className
        )}
        data-error={error ? "true" : undefined}
      >
        <span className="px-4 text-gray-700 font-bold text-base">₱</span>
        <input
          id={id}
          inputMode="decimal"
          className="h-full w-full bg-transparent pr-4 outline-none placeholder:text-gray-500 font-medium text-base"
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
        data-error={error ? "true" : undefined}
        className={clsx(
          "age-inclusive-input w-full rounded-xl border-2 bg-white px-4 font-medium outline-none transition-all shadow-sm",
          error
            ? "border-red-600 ring-2 ring-red-200 bg-red-50/50"
            : "border-gray-400 focus:border-[#7A0010] focus:ring-2 focus:ring-[#7A0010]/30 hover:border-gray-500",
          disabled && "bg-gray-100 text-gray-600 cursor-not-allowed",
          !value && "text-gray-500",
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
