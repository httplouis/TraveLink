import type { DriverProfile } from "@/app/types/driverProfile";

const LS_KEY = "travilink_driver_profile";

function splitName(full?: string) {
  if (!full) return { firstName: "", lastName: "" };
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts.slice(-1)[0] };
}

function getDefaultProfile(): DriverProfile {
  return {
    firstName: "",
    lastName: "",
    email: "",
    campus: "",
    dept: "",
    phone: "",
    license: "",
    canDrive: [],
    badges: [],
    avatar: undefined,
    notifyEmail: true,
    notifyPush: true,
  };
}

export async function loadProfile(): Promise<DriverProfile> {
  if (typeof window === "undefined") return getDefaultProfile();
  
  try {
    // Fetch from API first
    const response = await fetch('/api/profile');
    const result = await response.json();
    
    if (result.ok && result.data) {
      const data = result.data;
      const { firstName, lastName } = splitName(data.name);
      
      const profile: DriverProfile = {
        firstName,
        lastName,
        email: data.email || "",
        campus: data.campus || "",
        dept: data.department || "",
        phone: data.phone || "",
        license: data.license || "",
        canDrive: data.canDrive || [],
        badges: data.badges || [],
        avatar: data.avatarUrl,
        notifyEmail: data.prefs?.emailNotifications !== false,
        notifyPush: data.prefs?.pushNotifications !== false,
      };
      
      // Cache in localStorage for offline access
      localStorage.setItem(LS_KEY, JSON.stringify(profile));
      return profile;
    }
  } catch (error) {
    console.error('[loadProfile] API fetch failed:', error);
  }
  
  // Fallback to cached localStorage if API fails
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      return { ...getDefaultProfile(), ...(JSON.parse(raw) as DriverProfile) };
    }
  } catch {
    // Ignore parse errors
  }
  
  return getDefaultProfile();
}

export async function saveProfile(p: DriverProfile): Promise<void> {
  if (typeof window === "undefined") return;
  
  try {
    // Save to API
    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${p.firstName} ${p.lastName}`.trim(),
        phone: p.phone,
        preferences: {
          emailNotifications: p.notifyEmail,
          pushNotifications: p.notifyPush,
        },
      }),
    });
    
    if (response.ok) {
      // Cache in localStorage
      localStorage.setItem(LS_KEY, JSON.stringify(p));
    }
  } catch (error) {
    console.error('[saveProfile] API save failed:', error);
    // Fallback to localStorage only
    localStorage.setItem(LS_KEY, JSON.stringify(p));
  }
}
