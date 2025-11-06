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

function cacheProfile(profile: AdminProfile) {
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(profile));
  }
}

function getCachedProfile(): AdminProfile {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AdminProfile) : seed;
  } catch {
    return seed;
  }
}

export async function getProfile(): Promise<AdminProfile> {
  try {
    // Fetch from API
    const response = await fetch('/api/profile');
    const result = await response.json();
    
    if (result.ok && result.data) {
      const profile: AdminProfile = {
        id: result.data.id || seed.id,
        role: result.data.role || 'Admin',
        firstName: result.data.firstName || seed.firstName,
        lastName: result.data.lastName || seed.lastName,
        email: result.data.email || seed.email,
        phone: result.data.phone || seed.phone,
        department: result.data.department || seed.department,
        avatarUrl: result.data.avatarUrl || "",
        createdAt: result.data.joinedAt || seed.createdAt,
        updatedAt: new Date().toISOString(),
      };
      
      cacheProfile(profile);
      return profile;
    }
  } catch (error) {
    console.error('[AdminProfile] Load failed:', error);
  }
  
  // Fallback to cache
  return getCachedProfile();
}

export async function updateProfile(patch: Partial<AdminProfile>): Promise<AdminProfile> {
  try {
    // Update via API
    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    
    const result = await response.json();
    
    if (result.ok) {
      const current = await getProfile();
      const next: AdminProfile = { ...current, ...patch, updatedAt: new Date().toISOString() };
      cacheProfile(next);
      return next;
    }
  } catch (error) {
    console.error('[AdminProfile] Update failed:', error);
  }
  
  // Fallback to local
  const current = getCachedProfile();
  const next: AdminProfile = { ...current, ...patch, updatedAt: new Date().toISOString() };
  cacheProfile(next);
  return next;
}

export async function resetProfile(): Promise<AdminProfile> {
  cacheProfile(seed);
  return seed;
}
