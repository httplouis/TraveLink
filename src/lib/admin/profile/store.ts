// src/lib/admin/profile/store.ts
"use client";

import { create } from "zustand";
import type { AdminProfile } from "./types";
import { getProfile, updateProfile, resetProfile } from "./repo";

type ProfileState = {
  open: boolean;
  loading: boolean;
  saving: boolean;
  data: AdminProfile | null;
  openPanel: () => Promise<void>;
  closePanel: () => void;
  save: (patch: Partial<AdminProfile>) => Promise<void>;
  reload: () => Promise<void>;
  reset: () => Promise<void>;
};

export const useProfilePanel = create<ProfileState>((set, get) => ({
  open: false,
  loading: false,
  saving: false,
  data: null,
  openPanel: async () => {
    set({ open: true, loading: true });
    const data = await getProfile();
    set({ data, loading: false });
  },
  closePanel: () => set({ open: false }),
  save: async (patch) => {
    set({ saving: true });
    const next = await updateProfile(patch);
    set({ data: next, saving: false });
  },
  reload: async () => {
    set({ loading: true });
    const data = await getProfile();
    set({ data, loading: false });
  },
  reset: async () => {
    set({ loading: true });
    const data = await resetProfile();
    set({ data, loading: false });
  },
}));
