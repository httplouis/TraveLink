import type { UserProfile } from "./types";
const KEY = "tl.user";

export const ProfileRepo = {
  async load(): Promise<UserProfile | null> {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  },
  async save(p: UserProfile): Promise<void> {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(p));
  },
  defaults(email = "user@example.edu"): UserProfile {
    return {
      id: "local-1",
      firstName: "First",
      lastName: "Last",
      email,
      role: "Faculty",
      department: "",
      employeeId: "",
      phone: "",
      joinedAt: new Date().toISOString(),
      avatarUrl: null,
      prefs: { theme: "system", emailNotifications: true },
    };
  },
};
