"use client";

import { useEffect, useState } from "react";

type Props = {
  isOpen: boolean;
  message?: string;
};

export default function LoadingModal({ isOpen, message = "Loading..." }: Props) {
  const [dots, setDots] = useState("");

  // Animate dots
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-300">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-[#7A0010]/20 rounded-full blur-xl animate-pulse" />
            <img 
              src="/euwhite.png" 
              alt="TraviLink Logo" 
              width="64"
              height="64"
              className="relative h-16 w-16 drop-shadow-lg animate-bounce"
              style={{ animationDuration: '2s' }}
              loading="eager"
            />
          </div>
        </div>

        {/* Message */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {message}
            <span className="inline-block w-8 text-left">{dots}</span>
          </h3>
          <p className="text-sm text-gray-500">
            Please wait a moment
          </p>
        </div>

        {/* Spinner */}
        <div className="flex justify-center">
          <div className="relative w-16 h-16">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
            {/* Spinning ring */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#7A0010] animate-spin" />
            {/* Inner pulse */}
            <div className="absolute inset-2 rounded-full bg-[#7A0010]/10 animate-pulse" />
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#7A0010] to-[#a01020] rounded-full animate-progress" />
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          0% {
            width: 0%;
          }
          50% {
            width: 70%;
          }
          100% {
            width: 100%;
          }
        }
        
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
