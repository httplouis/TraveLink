// src/store/user/requestStore.ts
"use client";

import { create } from "zustand";
import { lockVehicle } from "@/lib/user/request/routing";
import type {
  RequestFormData,
  Reason,
  VehicleMode,
  RequesterRole,
} from "@/lib/user/request/types";

/* ---------- initial shape ---------- */

const initialData: RequestFormData = {
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
    endorsedByHeadName: "",
    endorsedByHeadDate: "",
    endorsedByHeadSignature: "",
  },
  schoolService: undefined,
  seminar: undefined,
};

/* ---------- tiny deep merge just for our shape ---------- */

function mergeData(base: RequestFormData, patch: Partial<RequestFormData>): RequestFormData {
  const next: RequestFormData = { ...base, ...patch };

  // travelOrder (deep)
  if (patch.travelOrder) {
    next.travelOrder = {
      ...(base.travelOrder || {}),
      ...(patch.travelOrder || {}),
    } as RequestFormData["travelOrder"];

    // costs (deeper)
    if (patch.travelOrder.costs) {
      next.travelOrder!.costs = {
        ...(base.travelOrder?.costs || {}),
        ...(patch.travelOrder.costs || {}),
      } as NonNullable<RequestFormData["travelOrder"]>["costs"];
    }
  }

  // schoolService (deep)
  if (patch.schoolService) {
    next.schoolService = {
      ...(base.schoolService || {}),
      ...(patch.schoolService || {}),
    } as NonNullable<RequestFormData["schoolService"]>;
  }

  // seminar (deep)
  if (patch.seminar) {
    next.seminar = {
      ...(base.seminar || {}),
      ...(patch.seminar || {}),
    } as NonNullable<RequestFormData["seminar"]>;
  }

  // transportation (deep)
  if (patch.transportation) {
    next.transportation = {
      ...(base.transportation || {}),
      ...(patch.transportation || {}),
    } as NonNullable<RequestFormData["transportation"]>;
  }

  return next;
}

/* ---------- store ---------- */

type Store = {
  data: RequestFormData;
  lockedVehicle: VehicleMode | null;

  currentDraftId: string | null;
  currentSubmissionId: string | null;

  // top-level setters
  setReason: (r: Reason) => void;
  setVehicleMode: (v: VehicleMode) => void;
  setRequesterRole: (r: RequesterRole) => void;

  // nested safe patchers (always deep-merge)
  patchTravelOrder: (p: Partial<RequestFormData["travelOrder"]>) => void;
  patchCosts: (p: Partial<NonNullable<RequestFormData["travelOrder"]["costs"]>>) => void;
  patchSchoolService: (p: Partial<NonNullable<RequestFormData["schoolService"]>>) => void;
  patchSeminar: (p: Partial<NonNullable<RequestFormData["seminar"]>>) => void;
  patchTransportation: (p: Partial<NonNullable<RequestFormData["transportation"]>>) => void;

  // generic deep-merge (safe kahit mali ang tumawag)
  patch: (p: Partial<RequestFormData>) => void;

  hardSet: (d: RequestFormData) => void;

  setCurrentDraftId: (id: string | null) => void;
  setCurrentSubmissionId: (id: string | null) => void;
  clearIds: () => void;
};

export const useRequestStore = create<Store>((set, get) => ({
  data: initialData,
  lockedVehicle: lockVehicle(initialData.reason) ?? null,

  currentDraftId: null,
  currentSubmissionId: null,

  setReason: (r) =>
    set((s) => {
      const locked = lockVehicle(r);
      const nextVehicle = locked ?? s.data.vehicleMode;
      return {
        data: { ...s.data, reason: r, vehicleMode: nextVehicle },
        lockedVehicle: locked ?? null,
      };
    }),

  setVehicleMode: (v) =>
    set((s) => {
      const next = s.lockedVehicle ? s.lockedVehicle : v;
      return { data: { ...s.data, vehicleMode: next } };
    }),

  setRequesterRole: (r) => set((s) => ({ data: { ...s.data, requesterRole: r } })),

  /* nested patchers */

  patchTravelOrder: (p) =>
    set((s) => ({
      data: mergeData(s.data, { travelOrder: p } as Partial<RequestFormData>),
    })),

  patchCosts: (p) =>
    set((s) => ({
      data: mergeData(s.data, { travelOrder: { costs: p } } as Partial<RequestFormData>),
    })),

  patchSchoolService: (p) =>
    set((s) => ({
      data: mergeData(s.data, { schoolService: p } as Partial<RequestFormData>),
    })),

  patchSeminar: (p) =>
    set((s) => ({
      data: mergeData(s.data, { seminar: p } as Partial<RequestFormData>),
    })),

  patchTransportation: (p) =>
    set((s) => ({
      data: mergeData(s.data, { transportation: p } as Partial<RequestFormData>),
    })),

  /* generic deep-merge — para kahit may lumang component na tumatawag ng patch({ travelOrder: { date: ... } })
     hindi niya nare-reset ang ibang fields */
  patch: (p) =>
    set((s) => ({
      data: mergeData(s.data, p),
    })),

  hardSet: (d) =>
    set(() => ({
      data: d,
      lockedVehicle: lockVehicle(d.reason) ?? null,
    })),

  setCurrentDraftId: (id) => set(() => ({ currentDraftId: id })),
  setCurrentSubmissionId: (id) => set(() => ({ currentSubmissionId: id })),
  clearIds: () => set(() => ({ currentDraftId: null, currentSubmissionId: null })),
}));
