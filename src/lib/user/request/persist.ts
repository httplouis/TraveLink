// src/lib/user/request/persist.ts
"use client";

import type { RequestFormData } from "@/lib/user/request/types";

const HANDOFF_KEY = "request-handoff";
const AUTOSAVE_KEY = "request-autosave-v1";

export type HandoffPayload = {
  data: RequestFormData;
  from: "draft" | "submission";
  id: string;
};

export function saveHandoff(p: HandoffPayload) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(p));
}

export function consumeHandoff(): HandoffPayload | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(HANDOFF_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(HANDOFF_KEY);
  try {
    return JSON.parse(raw) as HandoffPayload;
  } catch {
    return null;
  }
}

export function saveAutosave(data: RequestFormData) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ data, ts: Date.now() }));
}

export function loadAutosave(): RequestFormData | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(AUTOSAVE_KEY);
  if (!raw) return null;
  try {
    const { data } = JSON.parse(raw);
    return data as RequestFormData;
  } catch {
    return null;
  }
}

export function clearAutosave() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(AUTOSAVE_KEY);
}
