"use client";

import * as React from "react";

export default function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-xs font-medium text-neutral-600">{children}</label>;
}
