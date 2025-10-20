// src/lib/admin/profile/repo.ts
"use client";

import type { AdminProfile } from "./types";

const KEY = "travilink.admin.profile";

const seed: AdminProfile = {
  id: "u_admin_001",
  role: "Admin",
  firstName: "Admin",
  lastName: "User",
  email: "admin@travilink.edu",
  phone: "09xx xxx xxxx",
  department: "Transport Office",
  avatarUrl: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export async function getProfile(): Promise<AdminProfile> {
  const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
  if (!raw) {
    localStorage.setItem(KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw) as AdminProfile;
}

export async function updateProfile(patch: Partial<AdminProfile>): Promise<AdminProfile> {
  const current = await getProfile();
  const next: AdminProfile = { ...current, ...patch, updatedAt: new Date().toISOString() };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function resetProfile(): Promise<AdminProfile> {
  localStorage.setItem(KEY, JSON.stringify(seed));
  return seed;
}
