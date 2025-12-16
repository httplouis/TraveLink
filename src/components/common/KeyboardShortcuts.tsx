"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X, Command } from "lucide-react";

interface Shortcut {
  key: string;
  description: string;
  action: () => void;
  modifiers?: ("ctrl" | "alt" | "shift" | "meta")[];
}

interface KeyboardShortcutsProps {
  shortcuts: Shortcut[];
  showHelp?: boolean;
}

export default function KeyboardShortcuts({ shortcuts, showHelp = true }: KeyboardShortcutsProps) {
  const [showModal, setShowModal] = useState(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Show help modal with ?
      if (event.key === "?" && !event.ctrlKey && !event.altKey && !event.metaKey) {
        const target = event.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
          return;
        }
        event.preventDefault();
        setShowModal(true);
        return;
      }

      // Close modal with Escape
      if (event.key === "Escape" && showModal) {
        setShowModal(false);
        return;
      }

      // Check shortcuts - guard against undefined event.key
      if (!event.key) return;
      
      for (const shortcut of shortcuts) {
        const modifiersMatch =
          (!shortcut.modifiers || shortcut.modifiers.length === 0) ||
          (shortcut.modifiers.every((mod) => {
            switch (mod) {
              case "ctrl":
                return event.ctrlKey;
              case "alt":
                return event.altKey;
              case "shift":
                return event.shiftKey;
              case "meta":
                return event.metaKey;
              default:
                return false;
            }
          }) &&
            !shortcut.modifiers.includes("ctrl") === !event.ctrlKey &&
            !shortcut.modifiers.includes("alt") === !event.altKey &&
            !shortcut.modifiers.includes("shift") === !event.shiftKey &&
            !shortcut.modifiers.includes("meta") === !event.metaKey);

        if (event.key.toLowerCase() === shortcut.key.toLowerCase() && modifiersMatch) {
          const target = event.target as HTMLElement;
          if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
            return;
          }
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts, showModal]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const formatKey = (key: string, modifiers?: string[]) => {
    const parts: string[] = [];
    if (modifiers?.includes("meta")) parts.push("⌘");
    if (modifiers?.includes("ctrl")) parts.push("Ctrl");
    if (modifiers?.includes("alt")) parts.push("Alt");
    if (modifiers?.includes("shift")) parts.push("⇧");
    parts.push(key.toUpperCase());
    return parts.join(" + ");
  };

  return (
    <>
      {/* Help Button */}
      {showHelp && (
        <button
          onClick={() => setShowModal(true)}
          className="fixed bottom-20 right-6 z-40 h-10 w-10 rounded-full bg-gray-800 text-white shadow-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
          title="Keyboard Shortcuts (?)"
        >
          <Keyboard className="h-5 w-5" />
        </button>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Command className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Keyboard Shortcuts</h3>
                    <p className="text-white/70 text-sm">Press ? anytime to show</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Shortcuts List */}
              <div className="p-4 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {shortcuts.map((shortcut, index) => (
                    <motion.div
                      key={shortcut.key + (shortcut.modifiers?.join("") || "")}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm text-gray-700">{shortcut.description}</span>
                      <kbd className="px-2 py-1 rounded bg-gray-200 text-gray-800 text-xs font-mono font-bold">
                        {formatKey(shortcut.key, shortcut.modifiers)}
                      </kbd>
                    </motion.div>
                  ))}

                  {/* Default shortcuts */}
                  <div className="pt-4 mt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">System Shortcuts</p>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                      <span className="text-sm text-gray-700">Show this help</span>
                      <kbd className="px-2 py-1 rounded bg-gray-200 text-gray-800 text-xs font-mono font-bold">?</kbd>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 mt-2">
                      <span className="text-sm text-gray-700">Close modal</span>
                      <kbd className="px-2 py-1 rounded bg-gray-200 text-gray-800 text-xs font-mono font-bold">ESC</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
