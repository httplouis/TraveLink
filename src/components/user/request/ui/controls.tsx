"use client";

import * as React from "react";
import clsx from "clsx";

type BaseProps = {
  id?: string;
  label: string;
  placeholder?: string;
  value?: string | number | null;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
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

export function DateInput(props: BaseProps) {
  return (
    <FieldWrap label={props.label} error={props.error} helper={props.helper} required={props.required}>
      <input
        id={props.id}
        type="date"
        className={clsx(
          "h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none",
          "placeholder:text-neutral-400",
          props.error
            ? "border-rose-500 ring-2 ring-rose-100"
            : "border-neutral-300 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200",
          props.disabled && "bg-neutral-100 text-neutral-500",
          props.className
        )}
        value={(props.value as string) ?? ""}
        onChange={props.onChange as any}
        disabled={props.disabled}
      />
    </FieldWrap>
  );
}

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
}: BaseProps) {
  return (
    <FieldWrap label={label} error={error} helper={helper} required={required}>
      <textarea
        id={id}
        className={clsx(
          "min-h-[96px] w-full resize-y rounded-xl border bg-white px-3 py-2 text-sm outline-none",
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
