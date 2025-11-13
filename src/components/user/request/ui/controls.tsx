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
    <div className="grid gap-1.5 w-full">
      <label className="text-[13px] font-semibold text-gray-800 leading-tight">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="w-full">
        {children}
      </div>
      {error ? (
        <div className="mt-0.5 flex items-center gap-1.5 rounded-lg border-2 border-red-200 bg-red-50 px-2.5 py-1.5">
          <span className="text-xs font-medium text-red-700">{error}</span>
        </div>
      ) : helper ? (
        <span className="mt-0.5 text-xs text-gray-500 leading-tight">{helper}</span>
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
          "h-11 w-full rounded-xl border-2 bg-white px-4 text-sm font-medium outline-none transition-all shadow-sm",
          "placeholder:text-gray-400",
          error
            ? "border-red-500 ring-2 ring-red-100 bg-red-50/30"
            : "border-gray-300 focus:border-[#7A0010] focus:ring-2 focus:ring-[#7A0010]/20 hover:border-gray-400",
          disabled && "bg-gray-100 text-gray-500",
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
          "h-11 w-full rounded-xl border-2 bg-white px-4 text-sm font-medium outline-none transition-all shadow-sm",
          error
            ? "border-red-500 ring-2 ring-red-100 bg-red-50/30"
            : "border-gray-300 focus:border-[#7A0010] focus:ring-2 focus:ring-[#7A0010]/20 hover:border-gray-400",
          disabled && "bg-gray-100 text-gray-500",
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
          "w-full resize-y rounded-xl border-2 bg-white px-4 py-3 text-sm font-medium outline-none transition-all shadow-sm",
          "placeholder:text-gray-400",
          error
            ? "border-red-500 ring-2 ring-red-100 bg-red-50/30"
            : "border-gray-300 focus:border-[#7A0010] focus:ring-2 focus:ring-[#7A0010]/20 hover:border-gray-400",
          disabled && "bg-gray-100 text-gray-500",
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
          "flex h-11 items-center rounded-xl border-2 bg-white text-sm transition-all shadow-sm",
          error
            ? "border-red-500 ring-2 ring-red-100 bg-red-50/30"
            : "border-gray-300 focus-within:border-[#7A0010] focus-within:ring-2 focus-within:ring-[#7A0010]/20 hover:border-gray-400",
          disabled && "bg-gray-100 text-gray-500",
          className
        )}
        data-error={error ? "true" : undefined}
      >
        <span className="px-4 text-gray-600 font-semibold">₱</span>
        <input
          id={id}
          inputMode="decimal"
          className="h-full w-full bg-transparent pr-4 outline-none placeholder:text-gray-400 font-medium"
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
          "h-11 w-full rounded-xl border-2 bg-white px-4 text-sm font-medium outline-none transition-all shadow-sm",
          "placeholder:text-gray-400",
          error
            ? "border-red-500 ring-2 ring-red-100 bg-red-50/30"
            : "border-gray-300 focus:border-[#7A0010] focus:ring-2 focus:ring-[#7A0010]/20 hover:border-gray-400",
          disabled && "bg-gray-100 text-gray-500",
          !value && "text-gray-400",
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
