// store/user/requestStore.ts (temporary shim)
"use client";
import { createContext, useContext, useMemo, useState } from "react";
import type { RequestFormData, Reason, VehicleMode } from "@/lib/user/request/types";
import { lockVehicle } from "@/lib/user/request/routing";

const initial: RequestFormData = {
  requesterRole: "faculty",
  reason: "visit",
  vehicleMode: "owned",
  travelOrder: { date: "", requestingPerson: "", department: "", destination: "", departureDate: "", returnDate: "", purposeOfTravel: "", costs: {} },
  schoolService: undefined,
  seminar: undefined,
};

type Ctx = {
  data: RequestFormData;
  lockedVehicle: VehicleMode | null;
  setReason: (r: Reason) => void;
  setVehicleMode: (v: VehicleMode) => void;
  patch: (p: Partial<RequestFormData>) => void;
  hardSet: (n: RequestFormData) => void;
};

const RequestCtx = createContext<Ctx | null>(null);

export function RequestProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<RequestFormData>(initial);
  const [lockedVehicle, setLocked] = useState<VehicleMode | null>(null);

  const api = useMemo<Ctx>(() => ({
    data,
    lockedVehicle,
    setReason: (r) => {
      const locked = lockVehicle(r);
      const vehicleMode = locked ?? data.vehicleMode;
      setLocked(locked);
      setData({
        ...data,
        reason: r,
        vehicleMode,
        schoolService: vehicleMode === "institutional" ? (data.schoolService ?? { driver: "", vehicle: "", vehicleDispatcherSigned: false, vehicleDispatcherDate: "" }) : undefined,
        seminar: r === "seminar" ? (data.seminar ?? { applicationDate: "", title: "", dateFrom: "", dateTo: "" }) : undefined,
      });
    },
    setVehicleMode: (v) => {
      const nextV = lockedVehicle ?? v;
      setData({
        ...data,
        vehicleMode: nextV,
        schoolService: nextV === "institutional" ? (data.schoolService ?? { driver: "", vehicle: "", vehicleDispatcherSigned: false, vehicleDispatcherDate: "" }) : undefined,
      });
    },
    patch: (p) => setData({ ...data, ...p }),
    hardSet: (n) => setData(n),
  }), [data, lockedVehicle]);

  return <RequestCtx.Provider value={api}>{children}</RequestCtx.Provider>;
}

export function useRequestStore() {
  const ctx = useContext(RequestCtx);
  if (!ctx) throw new Error("useRequestStore must be used within <RequestProvider>");
  return ctx;
}
