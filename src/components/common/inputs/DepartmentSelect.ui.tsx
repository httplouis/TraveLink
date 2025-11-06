// src/components/common/inputs/DepartmentSelect.ui.tsx
"use client";

import * as React from "react";
import { DEPARTMENTS } from "@/lib/org/departments";

type Props = {
  id?: string;
  label?: string;
  value: string;
  onChange: (next: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
};

export default function DepartmentSelect({
  id,
  label = "Department",
  value,
  onChange,
  required,
  placeholder = "Type to search…",
  className = "",
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState(value || "");
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    setQ(value || "");
  }, [value]);

  const items = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return DEPARTMENTS;
    return DEPARTMENTS.filter((d) => d.toLowerCase().includes(needle));
  }, [q]);

  function pick(idx: number) {
    const choice = items[idx];
    if (!choice) return;
    onChange(choice);
    setQ(choice);
    setOpen(false);
    inputRef.current?.focus();
  }

  function closeSoon() {
    setTimeout(() => setOpen(false), 120);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (!items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(active || 0);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showClear = !!q;

  return (
    <label className={`grid w-full gap-1 ${className}`}>
      <span className="text-[13px] font-medium text-neutral-700">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </span>

      <div className="relative">
        <input
          id={id}
          ref={inputRef}
          required={required}
          value={q}
          placeholder={placeholder}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={closeSoon}
          onKeyDown={onKeyDown}
          className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 pr-10 text-sm outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
        />

        {/* Clear (×) — borderless, centered, clear hover affordance */}
        {showClear && (
          <button
            type="button"
            aria-label="Clear"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setQ("");
              onChange("");
              setOpen(true);
              setActive(0);
              inputRef.current?.focus();
            }}
            className="
              absolute right-2 inset-y-0 my-auto
              flex h-7 w-7 items-center justify-center
              rounded-full
              text-neutral-400
              hover:bg-neutral-100 hover:text-red-600
              active:bg-neutral-200
              transition
              translate-y-[0.5px]
            "
          >
            <svg viewBox="0 0 20 20" width="12" height="12" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        )}

        {/* Dropdown */}
        {open && (
          <div
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-neutral-200 bg-white shadow-lg"
            onMouseDown={(e) => e.preventDefault()} // keep focus on input
          >
            {items.length === 0 ? (
              <div className="px-3 py-2 text-sm text-neutral-500">No matches</div>
            ) : (
              items.map((item, idx) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => pick(idx)}
                  className={`block w-full px-3 py-2 text-left text-sm ${
                    idx === active ? "bg-neutral-100" : "hover:bg-neutral-50"
                  }`}
                  onMouseEnter={() => setActive(idx)}
                >
                  {item}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </label>
  );
}
