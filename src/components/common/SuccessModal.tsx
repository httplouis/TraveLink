"use client";

import * as React from "react";
import { Dialog } from "@headlessui/react";
import { CheckCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  autoCloseDelay?: number; // in milliseconds, default 2500
};

export default function SuccessModal({
  open,
  onClose,
  title = "Success",
  message,
  autoCloseDelay = 2500,
}: Props) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setIsVisible(true);
      
      // Auto-close after delay
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          onClose();
        }, 300); // Wait for fade-out animation
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [open, autoCloseDelay, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onClose={onClose} className="relative z-[100]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isVisible ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
          />
          <div className="fixed inset-0 grid place-items-center p-4">
            <Dialog.Panel
              as={motion.div}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ 
                opacity: isVisible ? 1 : 0, 
                scale: isVisible ? 1 : 0.9,
                y: isVisible ? 0 : 20
              }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start gap-4">
                <div className="mt-1 inline-flex h-12 w-12 flex-none items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-7 w-7 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-lg font-semibold text-gray-900 mb-1">
                    {title}
                  </Dialog.Title>
                  <div className="text-sm text-gray-600">
                    {message}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}

