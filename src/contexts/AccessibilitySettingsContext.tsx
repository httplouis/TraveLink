"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type AccessibilityMode = "basic" | "advanced";
export type FontMode = "default" | "dyslexia";
export type ContrastMode = "normal" | "high";
export type ThemeMode = "light" | "dark" | "system";

export interface AccessibilitySettings {
  mode: AccessibilityMode;
  fontMode: FontMode;
  contrastMode: ContrastMode;
  themeMode: ThemeMode;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  mode: "advanced",
  fontMode: "default",
  contrastMode: "normal",
  themeMode: "light",
};

const STORAGE_KEY = "travilink_accessibility_settings";

interface AccessibilitySettingsContextType {
  settings: AccessibilitySettings;
  updateSettings: (updates: Partial<AccessibilitySettings>) => void;
  resetSettings: () => void;
}

const AccessibilitySettingsContext = createContext<AccessibilitySettingsContextType | undefined>(undefined);

export function AccessibilitySettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);

  // Load settings from localStorage and backend on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const loadSettings = async () => {
      try {
        // First, try to load from backend (only if user is authenticated)
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          if (data.ok && data.data?.preferences?.accessibility) {
            setSettings({ ...DEFAULT_SETTINGS, ...data.data.preferences.accessibility });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.data.preferences.accessibility));
            setMounted(true);
            return;
          }
        } else if (response.status === 401) {
          // User is not authenticated - this is expected on login page, silently fall through to localStorage
        }
      } catch (error) {
        // Only log non-401 errors
        if (error instanceof TypeError && !error.message.includes('401')) {
          console.warn("[AccessibilitySettings] Failed to load from backend:", error);
        }
      }
      
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
      } catch (error) {
        console.error("[AccessibilitySettings] Failed to load settings:", error);
      }
      
      setMounted(true);
    };
    
    loadSettings();
  }, []);

  // Apply settings to document
  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    
    // Apply mode (basic = larger fonts, more spacing)
    if (settings.mode === "basic") {
      root.classList.add("accessibility-basic");
      root.classList.remove("accessibility-advanced");
    } else {
      root.classList.add("accessibility-advanced");
      root.classList.remove("accessibility-basic");
    }
    
    // Apply font mode
    if (settings.fontMode === "dyslexia") {
      root.classList.add("font-dyslexia");
      // Load OpenDyslexic font from CDN
      if (!document.getElementById("opendyslexic-font")) {
        const link = document.createElement("link");
        link.id = "opendyslexic-font";
        link.rel = "stylesheet";
        link.href = "https://cdn.jsdelivr.net/npm/opendyslexic@1.0.0/opendyslexic.css";
        document.head.appendChild(link);
      }
    } else {
      root.classList.remove("font-dyslexia");
    }
    
    // Apply contrast mode
    if (settings.contrastMode === "high") {
      root.classList.add("high-contrast");
      root.classList.remove("normal-contrast");
    } else {
      root.classList.add("normal-contrast");
      root.classList.remove("high-contrast");
    }
    
    // Apply theme mode - ensure light mode by default
    const applyTheme = (theme: "light" | "dark") => {
      // Always remove dark first to ensure clean state
      root.classList.remove("dark");
      root.classList.remove("light");
      
      if (theme === "dark") {
        root.classList.add("dark");
      } else {
        // Default to light mode
        root.classList.add("light");
      }
    };
    
    if (settings.themeMode === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(prefersDark ? "dark" : "light");
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? "dark" : "light");
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else {
      applyTheme(settings.themeMode);
    }
  }, [settings, mounted]);

  // Save settings to localStorage
  useEffect(() => {
    if (!mounted) return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      
      // Also sync to backend if user is logged in
      syncToBackend(settings);
    } catch (error) {
      console.error("[AccessibilitySettings] Failed to save settings:", error);
    }
  }, [settings, mounted]);

  const updateSettings = (updates: Partial<AccessibilitySettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <AccessibilitySettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </AccessibilitySettingsContext.Provider>
  );
}

export function useAccessibilitySettings() {
  const context = useContext(AccessibilitySettingsContext);
  if (context === undefined) {
    throw new Error("useAccessibilitySettings must be used within AccessibilitySettingsProvider");
  }
  return context;
}

// Sync settings to backend
async function syncToBackend(settings: AccessibilitySettings) {
  try {
    // Get current profile to merge preferences
    let currentPrefs = {};
    let isAuthenticated = false;
    
    try {
      const getResponse = await fetch("/api/profile");
      if (getResponse.ok) {
        const data = await getResponse.json();
        if (data.ok && data.data?.preferences) {
          currentPrefs = data.data.preferences;
          isAuthenticated = true;
        }
      } else if (getResponse.status === 401) {
        // User is not authenticated - skip backend sync silently
        return;
      }
    } catch (e) {
      // Network error - skip backend sync
      return;
    }
    
    // Only sync if user is authenticated
    if (!isAuthenticated) {
      return;
    }
    
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prefs: {
          ...currentPrefs,
          accessibility: settings,
        },
      }),
    });
    
    if (!response.ok) {
      // Only log if it's not a 401 (unauthorized) error
      if (response.status !== 401) {
        console.warn("[AccessibilitySettings] Failed to sync to backend");
      }
    }
  } catch (error) {
    // Silently fail - localStorage is the source of truth
    // Only log network errors (not 401 auth errors)
    if (error instanceof TypeError) {
      // Network error - silently ignore
      return;
    }
    console.warn("[AccessibilitySettings] Backend sync failed:", error);
  }
}

