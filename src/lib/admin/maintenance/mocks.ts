// src/lib/admin/maintenance/mocks.ts
import { Maintenance, MaintAttachment, NextDueTint } from "./types";
import { uid, upsert } from "./maintenance.repo";

function randomAttachment(): MaintAttachment {
  const isImg = Math.random() > 0.5;
  return {
    id: uid(),
    kind: isImg ? "img" : "pdf",
    name: isImg ? "IMG" : "PDF",
  };
}

export function seedMaintenance(count = 12) {
  const types = ["PMS", "Repair", "LTORenewal", "InsuranceRenewal"] as const;
  const vendors = ["AutoCare Center", "Malayan Insurance", "LTO", "QuickFix"];
  const vehicles = [
    "SEDAN-04 - Vios (KLM-2345)",
    "PICKUP-07 - Ford Ranger (NEO-5555)",
    "SUV-10 - Fortuner (XYZ-7777)",
  ];

  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 60));
    const due = new Date(date);
    due.setDate(due.getDate() + (14 + Math.floor(Math.random() * 60)));

    upsert({
      vehicle: vehicles[i % vehicles.length],
      type: types[i % types.length],
      status: (["Submitted", "In-Progress", "Completed"] as const)[i % 3],
      vendor: vendors[i % vendors.length],
      costPhp: Math.round(1000 + Math.random() * 4000),
      date: date.toISOString(),
      odometerAtService: 10000 + Math.round(Math.random() * 50000),
      description: "Auto-generated mock record",
      attachments: Math.random() > 0.6 ? [randomAttachment()] : [],
      nextDueAuto: true,
      nextDueDateISO: due.toISOString(),
      nextDueOdometer: undefined,
      nextDueTint: "ok" as NextDueTint,
      createdBy: "Seeder",
    } as any);
  }
}

export function clearAllMaintenance() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("tl:maintenance");
}
