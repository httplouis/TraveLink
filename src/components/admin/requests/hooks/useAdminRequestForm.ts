// src/components/admin/requests/hooks/useAdminRequestForm.ts
"use client";

import * as React from "react";

export type AdminTravelOrder = {
  requesterType: "Faculty" | "Head" | "Org";
  reason: string;
  vehicle: "Institutional" | "Owned" | "Rent";

  date: string;            // request date or departure date (your UI uses same state for both)
  returnDate: string;

  department: string;
  destination: string;
  purpose: string;

  costs: {
    food: number;
    driversAllowance: number;
    rent: number;
    hiredDrivers: number;
    accommodation: number;
  };

  endorserName?: string;
  endorsementDate?: string;

  signatureDataUrl?: string;
};

const INITIAL: AdminTravelOrder = {
  requesterType: "Faculty",
  reason: "",
  vehicle: "Owned",

  date: "",
  returnDate: "",

  department: "",
  destination: "",
  purpose: "",

  costs: {
    food: 0,
    driversAllowance: 0,
    rent: 0,
    hiredDrivers: 0,
    accommodation: 0,
  },

  endorserName: "",
  endorsementDate: "",
  signatureDataUrl: undefined,
};

export function useAdminRequestForm() {
  // ✅ use React.useState, not anything else
  const [values, setValues] = React.useState<AdminTravelOrder>(INITIAL);

  /** Set a single field */
  const set = React.useCallback(
    <K extends keyof AdminTravelOrder>(key: K, v: AdminTravelOrder[K]) => {
      setValues((prev) => ({ ...prev, [key]: v }));
    },
    []
  );

  /** Standard onChange factory for text/date inputs */
  const onChange =
    <K extends keyof AdminTravelOrder>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      set(key, e.target.value as AdminTravelOrder[K]);
    };

  /** Simulated submit — wire this to real API later */
  const onSubmit = React.useCallback(() => {
    // TODO: replace with real save (Supabase/REST)
    console.log("[Admin TO] submit:", values);
    alert("Submitted (mock). Check console.");
  }, [values]);

  /** Simulated draft save */
  const onSaveDraft = React.useCallback(() => {
    try {
      localStorage.setItem("admin.to.draft", JSON.stringify(values));
      alert("Draft saved (localStorage).");
    } catch {
      // no-op
    }
  }, [values]);

  /** Load draft once, if any */
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("admin.to.draft");
      if (raw) {
        const parsed = JSON.parse(raw);
        setValues((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore
    }
  }, []);

  return {
    values,
    set,
    onChange,
    onSubmit,
    onSaveDraft,
    setValues,
  };
}
