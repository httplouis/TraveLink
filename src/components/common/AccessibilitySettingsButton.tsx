"use client";

import React, { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import AccessibilitySettingsModal from "./AccessibilitySettingsModal";

export default function AccessibilitySettingsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only render on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything - this component is no longer used
  // Settings are now in the navigation bar
  return null;
}

