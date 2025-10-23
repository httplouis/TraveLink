"use client";

import * as React from "react";
import { Combobox, Transition } from "@headlessui/react";
import { Check, ChevronsUpDown, Search } from "lucide-react";

type Props = {
  departments: readonly string[];
  value: string | null | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  labelId?: string; // optional aria-labelledby
};

export default function DepartmentSelect({
  departments,
  value,
  onChange,
  placeholder = "Search department…",
  labelId,
}: Props) {
  const [query, setQuery] = React.useState("");

  const items = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter((d) => d.toLowerCase().includes(q));
  }, [departments, query]);

  return (
    <Combobox value={value ?? ""} onChange={(v: string) => onChange(v)}>
      <div className="relative">
        {/* Input */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Combobox.Input
            aria-labelledby={labelId}
            displayValue={(v: string) => v}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className={[
              "h-11 w-full rounded-xl border bg-white pl-9 pr-10 text-sm outline-none",
              "border-neutral-300 focus:ring-2 focus:ring-[--brand]",
            ].join(" ")}
          />
          <Combobox.Button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-500 hover:bg-neutral-100">
            <ChevronsUpDown className="h-4 w-4" />
          </Combobox.Button>
        </div>

        {/* Options */}
        <Transition
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery("")}
        >
          <Combobox.Options className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-neutral-200 bg-white py-1 text-sm shadow-lg focus:outline-none">
            {items.length === 0 ? (
              <div className="px-3 py-2 text-neutral-500">No results</div>
            ) : (
              items.map((d) => (
                <Combobox.Option
                  key={d}
                  value={d}
                  className={({ active }) =>
                    [
                      "flex cursor-pointer items-center justify-between px-3 py-2",
                      active ? "bg-neutral-100" : "",
                    ].join(" ")
                  }
                >
                  {({ selected }) => (
                    <>
                      <span className="truncate">{d}</span>
                      {selected ? <Check className="h-4 w-4 text-[var(--admin-brand,#7a0019)]" /> : null}
                    </>
                  )}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </Transition>
      </div>
    </Combobox>
  );
}
