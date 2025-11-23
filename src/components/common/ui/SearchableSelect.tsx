// src/components/common/ui/SearchableSelect.tsx
"use client";

import * as React from "react";
import { createPortal } from "react-dom";
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
  const [dropdownPos, setDropdownPos] = React.useState({ top: 0, left: 0, width: 0 });
  const selectRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [canRender, setCanRender] = React.useState(false);
  
  // Only render portal after mounting to avoid hydration mismatch
  React.useEffect(() => {
    setCanRender(true);
  }, []);

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

  // Update dropdown position when opening or scrolling
  React.useEffect(() => {
    const updatePosition = () => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const dropdownHeight = 320; // max-h-80 = 320px
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        // Determine if dropdown should open above or below
        const openAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
        
        // Ensure dropdown doesn't go off-screen horizontally
        const viewportWidth = window.innerWidth;
        let left = rect.left;
        if (left + rect.width > viewportWidth) {
          left = viewportWidth - rect.width - 10;
        }
        if (left < 10) {
          left = 10;
        }
        
        setDropdownPos({
          top: openAbove 
            ? Math.max(10, rect.top - dropdownHeight - 4)
            : Math.min(viewportHeight - dropdownHeight - 10, rect.bottom + 4),
          left: left,
          width: Math.min(rect.width, viewportWidth - 20),
        });
      }
    };

    updatePosition();

    if (isOpen) {
      // Listen to scroll on all scrollable containers
      const scrollableParents: (Element | Window)[] = [window];
      
      let parent = buttonRef.current?.parentElement;
      while (parent && parent !== document.body) {
        const style = window.getComputedStyle(parent);
        if (style.overflow === 'auto' || style.overflow === 'scroll' || 
            style.overflowY === 'auto' || style.overflowY === 'scroll' ||
            style.overflowX === 'auto' || style.overflowX === 'scroll') {
          scrollableParents.push(parent);
        }
        parent = parent.parentElement;
      }
      
      const scheduleUpdate = () => {
        requestAnimationFrame(updatePosition);
      };
      
      scrollableParents.forEach((element) => {
        element.addEventListener('scroll', scheduleUpdate, true);
      });
      
      window.addEventListener('resize', scheduleUpdate);
      window.addEventListener('scroll', scheduleUpdate, true);
      
      return () => {
        scrollableParents.forEach((element) => {
          element.removeEventListener('scroll', scheduleUpdate, true);
        });
        window.removeEventListener('resize', scheduleUpdate);
        window.removeEventListener('scroll', scheduleUpdate, true);
      };
    }
  }, [isOpen]);

  // Close dropdown when clicking outside or pressing Escape
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isInsideSelect = selectRef.current?.contains(target);
      const isInsideDropdown = dropdownRef.current?.contains(target);
      
      if (!isInsideSelect && !isInsideDropdown) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen]);

  // Handle option selection
  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  // Render dropdown content
  const dropdownContent = canRender && isOpen && (
    <div 
      ref={dropdownRef}
      className="fixed bg-white border-2 border-gray-300 rounded-lg shadow-2xl max-h-80 overflow-hidden"
      style={{ 
        top: `${dropdownPos.top}px`,
        left: `${dropdownPos.left}px`,
        width: `${dropdownPos.width}px`,
        minWidth: '250px',
        zIndex: 99999,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      }}
      onMouseDown={(e) => {
        // Prevent the click outside handler from firing when clicking inside dropdown
        e.stopPropagation();
      }}
    >
      {/* Search Input */}
      <div className="p-2 border-b border-gray-200 sticky top-0 bg-white z-10">
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
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect(option.value);
                }}
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
  );

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
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
        <span className={`truncate ${selectedOption ? "text-gray-900" : "text-gray-400"}`}>
          {selectedOption ? (
            <span className="truncate">
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
          className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Portal dropdown to body (only after client hydration) */}
      {canRender && dropdownContent && createPortal(dropdownContent, document.body)}
    </div>
  );
}

