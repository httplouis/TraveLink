"use client";

import * as React from "react";
import { useRequestStore } from "@/store/user/requestStore";
import type {
  RequestFormData,
  Reason,
  VehicleMode,
  RequesterRole,
} from "@/lib/user/request/types";
import { lockVehicle } from "@/lib/user/request/routing";
import { useToast } from "@/components/common/ui/ToastProvider.ui";

/** ---------- Public exports ---------- */

export function QuickFillCurrentButton() {
  const { data, hardSet, clearIds } = useRequestStore();
  const toast = useToast();

  function handleClick() {
    const filled = buildFilledData({
      requesterRole: data.requesterRole,
      reason: data.reason,
      vehicleMode: data.vehicleMode,
    });
    // ✅ important: detach any draft/submission id
    clearIds?.();
    hardSet(filled);
    toast({
      kind: "success",
      title: "Form populated",
      message: "Sample values were added based on your current choices.",
    });
  }

  return (
    <button
      onClick={handleClick}
      className="rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50"
      title="Dev: auto-fill with sample data"
      type="button"
    >
      ⚡ Fill current
    </button>
  );
}

/** Small menu with a few handy presets */
export function QuickFillMenu() {
  const { hardSet, clearIds } = useRequestStore();
  const toast = useToast();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(p: PresetKey) {
    const filled = buildPreset(p);
    // ✅ important: detach any draft/submission id
    clearIds?.();
    hardSet(filled);
    setOpen(false);
    toast({
      kind: "success",
      title: "Form populated",
      message: `Preset “${PRESETS[p].label}” loaded.`,
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50"
        title="Dev: choose a preset and auto-fill"
        type="button"
      >
        ⚡ Fill presets
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border bg-white shadow-xl">
          <ul className="divide-y text-sm">
            {Object.entries(PRESETS).map(([k, p]) => (
              <li key={k}>
                <button
                  className="block w-full px-3 py-2 text-left hover:bg-neutral-50"
                  onClick={() => pick(k as PresetKey)}
                  type="button"
                >
                  <div className="font-medium">{p.label}</div>
                  <div className="text-xs text-neutral-500">{p.desc}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** ---------- Internals ---------- */

type PresetKey =
  | "visitOwnedFaculty"
  | "seminarInstitutionalFaculty"
  | "headOwnedMeeting"
  | "educationalTripFaculty";

const PRESETS: Record<
  PresetKey,
  {
    label: string;
    desc: string;
    requesterRole: RequesterRole;
    reason: Reason;
    vehicleMode: VehicleMode;
  }
> = {
  visitOwnedFaculty: {
    label: "Visit • Owned • Faculty",
    desc: "No School Service; goes to Dept Head → Comptroller",
    requesterRole: "faculty",
    reason: "visit",
    vehicleMode: "owned",
  },
  seminarInstitutionalFaculty: {
    label: "Seminar • Institutional • Faculty",
    desc: "Seminar application + School Service; Dept Head → TM",
    requesterRole: "faculty",
    reason: "seminar",
    vehicleMode: "institutional",
  },
  headOwnedMeeting: {
    label: "Head • Meeting • Owned",
    desc: "Head requester; goes to Comptroller first",
    requesterRole: "head",
    reason: "seminar",
    vehicleMode: "owned",
  },
  educationalTripFaculty: {
    label: "Educational Trip • Institutional",
    desc: "Vehicle locked to institutional; School Service required",
    requesterRole: "faculty",
    reason: "educational",
    vehicleMode: "institutional",
  },
};

function buildPreset(key: PresetKey): RequestFormData {
  const { requesterRole, reason, vehicleMode } = PRESETS[key];
  return buildFilledData({ requesterRole, reason, vehicleMode });
}

/** Generates a valid filled form given a trio of choices */
function buildFilledData({
  requesterRole,
  reason,
  vehicleMode,
}: {
  requesterRole: RequesterRole;
  reason: Reason;
  vehicleMode: VehicleMode;
}): RequestFormData {
  const locked = lockVehicle(reason);
  const v = locked ?? vehicleMode;

  const today = new Date();
  const plus = (d: number) => {
    const x = new Date(today);
    x.setDate(x.getDate() + d);
    return x.toISOString().slice(0, 10);
  };

  const travelOrder: RequestFormData["travelOrder"] = {
    date: today.toISOString().slice(0, 10),
    requestingPerson: requesterRole === "head" ? "Dr. Jane Head" : "Prof. Juan Dela Cruz",
    department: requesterRole === "head" ? "Admin" : "CITE",
    destination:
      reason === "seminar"
        ? "Quezon City"
        : reason === "educational"
        ? "Science City of Muñoz"
        : reason === "competition"
        ? "Makati City"
        : "Bulacan",
    departureDate: plus(7),
    returnDate: plus(9),
    purposeOfTravel:
      reason === "seminar"
        ? "Attend the National Research Conference and coordination meeting."
        : reason === "educational"
        ? "Educational exposure trip to partner institution and museum."
        : reason === "competition"
        ? "Coach and support students in inter-school skills competition."
        : "Campus visit and coordination with partner school.",
    costs: {
      food: 1500,
      driversAllowance: v === "institutional" ? 1000 : 0,
      rentVehicles: v === "rent" ? 5000 : 0,
      hiredDrivers: v === "rent" ? 1500 : 0,
      accommodation: 3200,
      otherLabel: "Printing",
      otherAmount: 400,
      justification: v === "rent" ? "No institutional vehicle available on requested dates." : undefined,
    },
    endorsedByHeadName: requesterRole === "faculty" ? "Engr. Maria DeptHead" : "",
    endorsedByHeadDate: requesterRole === "faculty" ? plus(1) : "",
  };

  const schoolService: RequestFormData["schoolService"] =
    v === "institutional"
      ? {
          driver: "R. Santos",
          vehicle: "L300 Van • ABC-1234",
          vehicleDispatcherSigned: true,
          vehicleDispatcherDate: plus(2),
        }
      : undefined;

  const seminar: RequestFormData["seminar"] =
    reason === "seminar"
      ? {
          applicationDate: today.toISOString().slice(0, 10),
          title: "National Research Conference 2025",
          dateFrom: plus(14),
          dateTo: plus(16),
          typeOfTraining: ["Workshop", "Paper Presentation"],
          trainingCategory: "national",
          sponsor: "CHED",
          venue: "UP Diliman",
          modality: "Onsite",
          fees: { registrationFee: 2500, totalAmount: 7200 },
          breakdown: {
            registration: 2500,
            accommodation: 3200,
            perDiemMealsDriversAllowance: 800,
            transportFareGasParkingToll: 600,
            otherLabel: "Materials",
            otherAmount: 100,
          },
          makeUpClassSchedule: "Make-up classes scheduled next week, Wed/Thu 3–5 PM.",
          applicantUndertaking: true,
          fundReleaseLine: 7200,
        }
      : undefined;

  return {
    requesterRole,
    reason,
    vehicleMode: v,
    travelOrder,
    schoolService,
    seminar,
  };
}
