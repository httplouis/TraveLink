"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  // Read saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("tl-theme");
    const enabled = saved === "dark";
    setIsDark(enabled);
    const d = document.documentElement;
    d.classList.remove("dark");
    if (enabled) d.classList.add("dark");
  }, []);

  // Keep other tabs/windows in sync
  useEffect(() => {
    const onStorage = () => {
      const enabled = localStorage.getItem("tl-theme") === "dark";
      setIsDark(enabled);
      const d = document.documentElement;
      d.classList.remove("dark");
      if (enabled) d.classList.add("dark");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("tl-theme", next ? "dark" : "light");
    const d = document.documentElement;
    d.classList.remove("dark");
    if (next) d.classList.add("dark");
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1f1f1f] hover:bg-neutral-50 dark:hover:bg-[#242424]"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
