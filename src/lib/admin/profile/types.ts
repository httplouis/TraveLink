// src/lib/admin/profile/types.ts
export type AdminProfile = {
  id: string;
  role: "Admin" | "Staff";
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department?: string;
  avatarUrl?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};
