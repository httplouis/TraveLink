import type { UserProfile } from "./types";

const KEY = "tl.user";

function cacheProfile(profile: UserProfile) {
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(profile));
  }
}

function getCachedProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export const ProfileRepo = {
  async load(): Promise<UserProfile | null> {
    try {
      // Fetch from API
      const response = await fetch('/api/profile');
      const result = await response.json();
      
      if (result.ok && result.data) {
        const profile = result.data as UserProfile;
        cacheProfile(profile);
        return profile;
      }
    } catch (error) {
      console.error('[ProfileRepo] Load failed:', error);
    }
    
    // Fallback to cache
    return getCachedProfile();
  },
  
  async save(p: UserProfile): Promise<void> {
    try {
      // Save to API
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      
      const result = await response.json();
      
      if (result.ok) {
        cacheProfile(p);
        return;
      }
    } catch (error) {
      console.error('[ProfileRepo] Save failed:', error);
    }
    
    // Fallback to cache only
    cacheProfile(p);
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
