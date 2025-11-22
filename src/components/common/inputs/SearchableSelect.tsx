// src/components/common/inputs/SearchableSelect.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

type Option = {
  value: string;
  label: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
};

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Type to search...",
  className = "",
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const [canRender, setCanRender] = useState(false);
  
  // Only render portal after mounting to avoid hydration mismatch
  useEffect(() => {
    setCanRender(true);
  }, []);

  // Sync display value with selected value (only when not focused)
  useEffect(() => {
    if (!isOpen) {
      const selectedOption = options.find((opt) => opt.value === value);
      // Don't show "All Departments" in the input, keep it empty for easier typing
      if (selectedOption?.value === "All") {
        setQ("");
      } else {
        setQ(selectedOption?.label || "");
      }
    }
  }, [value, options, isOpen]);

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) => {
      const labelMatch = option.label.toLowerCase().includes(needle);
      // Also search by code if available (for departments)
      const codeMatch = (option as any).code?.toLowerCase().includes(needle);
      return labelMatch || codeMatch;
    });
  }, [q, options]);

  function pick(idx: number) {
    const choice = filteredOptions[idx];
    if (!choice) return;
    onChange(choice.value);
    setQ(choice.label);
    setIsOpen(false);
    inputRef.current?.focus();
  }

  function closeSoon() {
    setTimeout(() => {
      setIsOpen(false);
      // Reset to selected value if closing without selection
      const selectedOption = options.find((opt) => opt.value === value);
      setQ(selectedOption?.label || "");
    }, 120);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
      setIsOpen(true);
      return;
    }
    if (!filteredOptions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filteredOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(active || 0);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      const selectedOption = options.find((opt) => opt.value === value);
      setQ(selectedOption?.label || "");
    }
  }

  const showClear = !!q && value !== "All";

  // Update dropdown position when opening or scrolling
  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        
        // Calculate position relative to viewport (fixed positioning uses viewport coordinates)
        const viewportHeight = window.innerHeight;
        const dropdownHeight = 240; // max-h-60 = 240px
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        // Determine if dropdown should open above or below
        const openAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
        
        setDropdownPos({
          top: openAbove 
            ? rect.top - dropdownHeight - 4  // Open above
            : rect.bottom + 4,                 // Open below
          left: rect.left,
          width: rect.width,
        });
      }
    };

    updatePosition();

    if (isOpen) {
      // Listen to scroll on all scrollable containers, not just window
      const scrollableParents: (Element | Window)[] = [window];
      
      // Find all scrollable parent elements
      let parent = inputRef.current?.parentElement;
      while (parent) {
        const style = window.getComputedStyle(parent);
        if (style.overflow === 'auto' || style.overflow === 'scroll' || 
            style.overflowY === 'auto' || style.overflowY === 'scroll') {
          scrollableParents.push(parent);
        }
        parent = parent.parentElement;
      }
      
      // Add scroll listeners to all scrollable parents
      scrollableParents.forEach((element) => {
        element.addEventListener('scroll', updatePosition, true);
      });
      
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      
      return () => {
        scrollableParents.forEach((element) => {
          element.removeEventListener('scroll', updatePosition, true);
        });
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen]);

  // Render dropdown with animation (only client-side)
  const dropdownContent = canRender && (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8, scaleY: 0.9 }}
          animate={{ opacity: 1, y: 0, scaleY: 1 }}
          exit={{ opacity: 0, y: -8, scaleY: 0.9 }}
          transition={{ 
            duration: 0.3, 
            ease: [0.4, 0.0, 0.2, 1] // Smooth easeInOut like sidebar
          }}
          className="fixed max-h-60 overflow-auto rounded-xl border-2 border-neutral-200 bg-white shadow-xl origin-top"
          onMouseDown={(e) => e.preventDefault()}
          style={{
            top: `${dropdownPos.top}px`,
            left: `${dropdownPos.left}px`,
            width: `${dropdownPos.width}px`,
            zIndex: 99999,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          }}
        >
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-neutral-500 text-center">
              No matches found
            </div>
          ) : (
            filteredOptions.map((option, idx) => (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => pick(idx)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  delay: idx * 0.03, 
                  duration: 0.25,
                  ease: [0.4, 0.0, 0.2, 1]
                }}
                className={`block w-full px-4 py-2.5 text-left text-sm transition-colors ${
                  idx === active
                    ? "bg-[#7A0010] text-white font-medium"
                    : "hover:bg-neutral-50 text-neutral-900"
                }`}
                onMouseEnter={() => setActive(idx)}
              >
                {option.label}
              </motion.button>
            ))
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={q}
        placeholder={placeholder}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
          setIsOpen(true);
        }}
        onFocus={() => {
          setIsOpen(true);
          // Clear if showing "All Departments" placeholder behavior
          if (value === "All" && !q) {
            setQ("");
          }
        }}
        onBlur={closeSoon}
        onKeyDown={onKeyDown}
        className="appearance-none w-full px-4 py-2.5 pr-10 text-sm font-medium border-2 border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A0010] focus:border-[#7A0010] transition-all bg-white hover:border-[#7A0010] hover:shadow-sm"
      />

      {/* Clear button */}
      {showClear && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setQ("");
            onChange("All");
            setIsOpen(true);
            setActive(0);
            inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-red-600 active:bg-neutral-200 transition"
        >
          <svg viewBox="0 0 20 20" width="12" height="12">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {/* Portal dropdown to body (only after client hydration) */}
      {canRender && dropdownContent && createPortal(dropdownContent, document.body)}
    </div>
  );
}
