// src/components/common/ui/SearchableSelect.tsx
"use client";

import * as React from "react";
import { Search, ChevronDown, X } from "lucide-react";

interface SearchableSelectOption {
  value: string;
  label: string;
  code?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Search and select...",
  emptyMessage = "No options found",
  className = "",
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const selectRef = React.useRef<HTMLDivElement>(null);

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options;
    
    const query = searchQuery.toLowerCase();
    return options.filter((opt) => {
      const label = opt.label.toLowerCase();
      const code = opt.code?.toLowerCase() || "";
      return label.includes(query) || code.includes(query);
    });
  }, [options, searchQuery]);

  // Get selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Handle option selection
  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full rounded-lg border-2 px-3 py-1.5 text-sm font-medium
          focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none
          transition-all flex items-center justify-between
          ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white hover:border-gray-400"}
          ${isOpen ? "border-purple-500" : "border-gray-300"}
        `}
      >
        <span className={selectedOption ? "text-gray-900" : "text-gray-400"}>
          {selectedOption ? (
            <span>
              {selectedOption.label}
              {selectedOption.code && (
                <span className="text-gray-500 ml-1">({selectedOption.code})</span>
              )}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-[9999] w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-2xl max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search department..."
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-sm"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-64">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                {emptyMessage}
              </div>
            ) : (
              <div className="py-1">
                {filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`
                      w-full px-4 py-2.5 text-left text-sm
                      hover:bg-purple-50 transition-colors
                      ${value === option.value ? "bg-purple-100 font-medium" : ""}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900">{option.label}</span>
                      {option.code && (
                        <span className="text-gray-500 text-xs ml-2">({option.code})</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

