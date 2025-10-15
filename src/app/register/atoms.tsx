// src/components/auth/register/atoms.tsx
"use client";
import * as React from "react";

export const Input = (props: React.ComponentProps<"input">) => (
  <input
    {...props}
    autoComplete="off"
    className={
      "h-10 w-full rounded-md border border-gray-300 px-3 text-[13px] text-gray-900 " +
      "placeholder-gray-500 shadow-sm outline-none focus:border-red-900 focus:ring-2 focus:ring-red-900/30 " +
      (props.className ?? "")
    }
  />
);

export const Select = (props: React.ComponentProps<"select">) => (
  <select
    {...props}
    className={
      "h-10 w-full rounded-md border border-gray-300 px-3 text-[13px] text-gray-900 shadow-sm outline-none " +
      "focus:border-red-900 focus:ring-2 focus:ring-red-900/30 " +
      (props.className ?? "")
    }
  />
);

export const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="mb-1 block text-[12px] font-medium text-gray-800">{children}</label>
);
