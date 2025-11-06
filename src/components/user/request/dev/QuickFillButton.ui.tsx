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
    try {
      console.log("[QuickFill] Button clicked!"); // First log to confirm button works
      console.log("[QuickFill] Current data:", data);
      
      const filled = buildFilledData({
        requesterRole: data.requesterRole,
        reason: data.reason,
        vehicleMode: data.vehicleMode,
      });
      
      console.log("[QuickFill] Built data:", filled);
      // Log what was filled for debugging
      console.log("[QuickFill] Celebrity:", filled.travelOrder?.requestingPerson);
      console.log("[QuickFill] Destination:", filled.travelOrder?.destination);
      console.log("[QuickFill] Driver ID:", filled.schoolService?.preferredDriver);
      console.log("[QuickFill] Vehicle ID:", filled.schoolService?.preferredVehicle);
      console.log("[QuickFill] NOTE: Driver ID is test UUID, Vehicle ID is real UUID from DB");
      
      // ✅ important: detach any draft/submission id
      clearIds?.();
      hardSet(filled);
      toast({
        kind: "success",
        title: "Form populated",
        message: "Sample values were added based on your current choices.",
      });
    } catch (error) {
      console.error("[QuickFill] ERROR:", error);
      toast({
        kind: "error",
        title: "QuickFill Error",
        message: String(error),
      });
    }
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

  // Hollywood celebrity names for CNAHS (Random each time!)
  const celebrities = [
    "Leonardo DiCaprio",
    "Scarlett Johansson", 
    "Tom Holland",
    "Emma Stone",
    "Chris Hemsworth",
    "Zendaya Coleman",
    "Ryan Reynolds",
    "Margot Robbie",
    "Anne Hathaway",
    "Tom Cruise",
    "Jennifer Lawrence",
    "Chris Evans",
    "Emma Watson",
    "Dwayne Johnson",
    "Michael B. Jordan",
    "Brie Larson",
    "Benedict Cumberbatch",
    "Florence Pugh",
    "Timothée Chalamet",
    "Lupita Nyong'o"
  ];
  // Pick random celebrity - different every time!
  const randomCelebrity = celebrities[Math.floor(Math.random() * celebrities.length)];

  // Random hospitals and destinations
  const hospitals = [
    "Philippine General Hospital, Manila",
    "St. Luke's Medical Center, Quezon City",
    "Makati Medical Center, Makati City",
    "Asian Hospital and Medical Center, Muntinlupa",
    "Philippine Heart Center, Quezon City",
    "Veterans Memorial Medical Center, Quezon City",
    "The Medical City, Pasig",
    "Manila Doctor's Hospital, Manila"
  ];
  const randomHospital = hospitals[Math.floor(Math.random() * hospitals.length)];

  const travelOrder: RequestFormData["travelOrder"] = {
    date: today.toISOString().slice(0, 10),
    requestingPerson: requesterRole === "head" ? "Dr. Jane Head" : randomCelebrity,
    department: requesterRole === "head" ? "Admin" : "College of Nursing and Allied Health Sciences (CNAHS)",
    destination:
      reason === "seminar"
        ? "SMX Convention Center, Pasay City"
        : reason === "educational"
        ? randomHospital
        : reason === "competition"
        ? "St. Luke's Medical Center, Quezon City"
        : randomHospital,
    departureDate: plus(7),
    returnDate: plus(9),
    purposeOfTravel:
      reason === "seminar"
        ? "Nursing Leadership and Management Seminar"
        : reason === "educational"
        ? "Clinical rotation and hospital exposure program"
        : reason === "competition"
        ? "Inter-school nursing skills competition"
        : "Campus visit and coordination with partner hospital",
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

  // REAL vehicle IDs from your database!
  const vehicles = [
    { name: "Bus 1", plate: "ABC-1234", id: "0e9dc284-d380-46a7-8aa9-27baba0b5100" },
    { name: "Van 2", plate: "DRV-1001", id: "781d619f-2134-4f2f-e6a4-88bc269529aa" },
    { name: "Van 1", plate: "XYZ-5678", id: "b336080f-a797-4a33-b53d-35ea5e417e1a" },
    { name: "Car 3", plate: "QWE-1122", id: "32be315f-4981-4850-b111-a5b8b4bb4e38" },
    { name: "Bus 1", plate: "MSE-001", id: "eac79a97-86c8-4cdf-9f12-9c472223d249" },
  ];
  
  // Test driver IDs (these might not match real DB, but for testing data flow)
  const drivers = [
    { name: "Driver A - Juan Santos", id: "test-driver-uuid-1" },
    { name: "Driver B - Maria Cruz", id: "test-driver-uuid-2" },
    { name: "Driver C - Pedro Reyes", id: "test-driver-uuid-3" },
  ];
  
  const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];
  const randomVehicle = vehicles[Math.floor(Math.random() * vehicles.length)];

  const schoolService: RequestFormData["schoolService"] =
    v === "institutional"
      ? {
          driver: randomDriver.name,
          vehicle: `${randomVehicle.name} • ${randomVehicle.plate}`,
          vehicleDispatcherSigned: true,
          vehicleDispatcherDate: plus(2),
          // CRITICAL: Only set vehicle ID (driver is optional)
          // Driver ID left empty to avoid foreign key error with test UUIDs
          preferredVehicle: randomVehicle.id,  // Real vehicle UUID
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
