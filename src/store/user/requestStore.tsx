// store/user/requestStore.tsx
// COMPLETE FILE — adds currentDraftId/currentSubmissionId helpers

"use client";
import * as React from "react";
import { createContext, useContext, useMemo, useState } from "react";
import type {
  RequestFormData,
  Reason,
  VehicleMode,
  RequesterRole,
} from "@/lib/user/request/types";
import { lockVehicle } from "@/lib/user/request/routing";

const initial: RequestFormData = {
  requesterRole: "faculty",
  reason: "visit",
  vehicleMode: "owned",
  travelOrder: {
    date: "",
    requestingPerson: "",
    department: "",
    destination: "",
    departureDate: "",
    returnDate: "",
    purposeOfTravel: "",
    costs: {},
  },
  schoolService: undefined,
  seminar: undefined,
};

type Ctx = {
  data: RequestFormData;
  lockedVehicle: VehicleMode | null;
  currentDraftId: string | null;
  currentSubmissionId: string | null;
  setReason: (r: Reason) => void;
  setVehicleMode: (v: VehicleMode) => void;
  patch: (p: Partial<RequestFormData>) => void;
  hardSet: (n: RequestFormData) => void;
  setCurrentDraftId: (id: string | null) => void;
  setCurrentSubmissionId: (id: string | null) => void;
  clearIds: () => void;
};

const RequestCtx = createContext<Ctx | null>(null);

export function RequestProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<RequestFormData>(initial);
  const [lockedVehicle, setLocked] = useState<VehicleMode | null>(null);
  const [currentDraftId, setDraftId] = useState<string | null>(null);
  const [currentSubmissionId, setSubmissionId] = useState<string | null>(null);

  const api = useMemo<Ctx>(
    () => ({
      data,
      lockedVehicle,
      currentDraftId,
      currentSubmissionId,

      setReason: (r) => {
        const locked = lockVehicle(r);
        const vehicleMode = locked ?? data.vehicleMode;
        setLocked(locked);
        setData({
          ...data,
          reason: r,
          vehicleMode,
          schoolService:
            vehicleMode === "institutional"
              ? data.schoolService ?? {
                  driver: "",
                  vehicle: "",
                  vehicleDispatcherSigned: false,
                  vehicleDispatcherDate: "",
                }
              : undefined,
          seminar:
            r === "seminar"
              ? data.seminar ?? {
                  applicationDate: "",
                  title: "",
                  dateFrom: "",
                  dateTo: "",
                }
              : undefined,
        });
      },

      setVehicleMode: (v) => {
        const nextV = lockedVehicle ?? v;
        setData({
          ...data,
          vehicleMode: nextV,
          schoolService:
            nextV === "institutional"
              ? data.schoolService ?? {
                  driver: "",
                  vehicle: "",
                  vehicleDispatcherSigned: false,
                  vehicleDispatcherDate: "",
                }
              : undefined,
        });
      },

      patch: (p) => setData({ ...data, ...p }),
      hardSet: (n) => setData(n),

      setCurrentDraftId: (id) => setDraftId(id),
      setCurrentSubmissionId: (id) => setSubmissionId(id),
      clearIds: () => {
        setDraftId(null);
        setSubmissionId(null);
      },
    }),
    [data, lockedVehicle, currentDraftId, currentSubmissionId]
  );

  return React.createElement(RequestCtx.Provider, { value: api }, children);
}

export function useRequestStore() {
  const ctx = useContext(RequestCtx);
  if (!ctx) throw new Error("useRequestStore must be used within <RequestProvider>");
  return ctx;
}
