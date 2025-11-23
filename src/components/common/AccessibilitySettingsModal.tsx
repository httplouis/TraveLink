"use client";

import React, { useState } from "react";
import { X, Settings, Eye, Type, Contrast, Moon, Sun, Monitor, Check } from "lucide-react";
import { useAccessibilitySettings, AccessibilityMode, FontMode, ContrastMode, ThemeMode } from "@/contexts/AccessibilitySettingsContext";

interface AccessibilitySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccessibilitySettingsModal({ isOpen, onClose }: AccessibilitySettingsModalProps) {
  const { settings, updateSettings, resetSettings } = useAccessibilitySettings();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#7A0010] text-white flex items-center justify-center">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Accessibility Settings</h2>
              <p className="text-sm text-gray-600">Customize your experience for better usability</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Mode Selection */}
          <SettingSection
            title="Display Mode"
            description="Choose between Basic mode with larger fonts and increased spacing, or Advanced mode with standard sizing for optimal screen space utilization"
            icon={<Eye className="h-5 w-5" />}
            isOpen={activeSection === "mode"}
            onToggle={() => toggleSection("mode")}
          >
            <div className="space-y-3">
              <ModeOption
                value="basic"
                label="Basic Mode"
                description="Enhanced readability with larger fonts and increased spacing for improved visibility"
                selected={settings.mode === "basic"}
                onSelect={() => updateSettings({ mode: "basic" })}
              />
              <ModeOption
                value="advanced"
                label="Advanced Mode"
                description="Standard font sizing and compact layout for efficient screen space usage"
                selected={settings.mode === "advanced"}
                onSelect={() => updateSettings({ mode: "advanced" })}
              />
            </div>
          </SettingSection>

          {/* Font Options */}
          <SettingSection
            title="Font Options"
            description="Choose your preferred font for better readability"
            icon={<Type className="h-5 w-5" />}
            isOpen={activeSection === "font"}
            onToggle={() => toggleSection("font")}
          >
            <div className="space-y-3">
              <ModeOption
                value="default"
                label="Default Font"
                description="Standard system font (Arial, Helvetica)"
                selected={settings.fontMode === "default"}
                onSelect={() => updateSettings({ fontMode: "default" })}
              />
              <ModeOption
                value="dyslexia"
                label="Dyslexia-Friendly Font"
                description="OpenDyslexic font designed to increase readability for readers with dyslexia"
                selected={settings.fontMode === "dyslexia"}
                onSelect={() => updateSettings({ fontMode: "dyslexia" })}
              />
            </div>
          </SettingSection>

          {/* Contrast Mode */}
          <SettingSection
            title="Color Contrast"
            description="High contrast enhances color contrast of UI elements, making them more distinct and easier to identify"
            icon={<Contrast className="h-5 w-5" />}
            isOpen={activeSection === "contrast"}
            onToggle={() => toggleSection("contrast")}
          >
            <div className="space-y-3">
              <ModeOption
                value="normal"
                label="Normal Contrast"
                description="Standard color contrast for regular viewing"
                selected={settings.contrastMode === "normal"}
                onSelect={() => updateSettings({ contrastMode: "normal" })}
              />
              <ModeOption
                value="high"
                label="High Contrast"
                description="Enhanced color contrast for better visibility. Note: Institution branding may be disabled."
                selected={settings.contrastMode === "high"}
                onSelect={() => updateSettings({ contrastMode: "high" })}
              />
            </div>
          </SettingSection>

          {/* Theme Mode */}
          <SettingSection
            title="Theme"
            description="Choose between light, dark, or system theme"
            icon={<Moon className="h-5 w-5" />}
            isOpen={activeSection === "theme"}
            onToggle={() => toggleSection("theme")}
          >
            <div className="space-y-3">
              <ModeOption
                value="light"
                label="Light Mode"
                description="Light background with dark text"
                icon={<Sun className="h-5 w-5" />}
                selected={settings.themeMode === "light"}
                onSelect={() => updateSettings({ themeMode: "light" })}
              />
              <ModeOption
                value="dark"
                label="Dark Mode"
                description="Dark background with light text"
                icon={<Moon className="h-5 w-5" />}
                selected={settings.themeMode === "dark"}
                onSelect={() => updateSettings({ themeMode: "dark" })}
              />
              <ModeOption
                value="system"
                label="System Default"
                description="Follow your device's theme preference"
                icon={<Monitor className="h-5 w-5" />}
                selected={settings.themeMode === "system"}
                onSelect={() => updateSettings({ themeMode: "system" })}
              />
            </div>
          </SettingSection>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={resetSettings}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#7A0010] text-white font-semibold rounded-lg hover:bg-[#8A0010] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingSection({
  title,
  description,
  icon,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center">
            {icon}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        <div className={`transform transition-transform ${isOpen ? "rotate-180" : ""}`}>
          <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
}

function ModeOption({
  value,
  label,
  description,
  icon,
  selected,
  onSelect,
}: {
  value: string;
  label: string;
  description: string;
  icon?: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
        selected
          ? "border-[#7A0010] bg-[#7A0010]/5"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
          selected ? "border-[#7A0010] bg-[#7A0010]" : "border-gray-300"
        }`}>
          {selected && <Check className="h-3 w-3 text-white" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {icon && <div className="text-gray-600">{icon}</div>}
            <span className={`font-semibold ${selected ? "text-[#7A0010]" : "text-gray-900"}`}>
              {label}
            </span>
          </div>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </button>
  );
}

