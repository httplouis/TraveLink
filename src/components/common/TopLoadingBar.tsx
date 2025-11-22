"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Top Loading Bar - Enhanced thin progress bar at the top of the page
 * Similar to nprogress but custom implementation with better animations
 */
function TopLoadingBarContent() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clean up any existing timers
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Reset loading on route change
    setLoading(true);
    setProgress(0);

    // Start with a small progress to show immediately
    setProgress(8);

    // Simulate progress - faster initial, slower near completion
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return 90;
        }
        // Accelerate then slow down for natural feel
        const increment = prev < 30 ? 18 : prev < 60 ? 10 : prev < 80 ? 5 : 2;
        return Math.min(prev + increment, 90);
      });
    }, 60);

    // Complete after route change completes (faster for better UX)
    timeoutRef.current = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
    }, 400);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [pathname, searchParams]);

  if (!loading && progress === 0) return null;

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
        style={{
          height: '3px',
        }}
      >
        {/* Main progress bar */}
        <div
          className="h-full bg-gradient-to-r from-[#7A0010] via-[#9A0020] to-[#7A0010] transition-all duration-200 ease-out relative overflow-hidden"
          style={{
            width: `${progress}%`,
            opacity: loading ? 1 : 0,
            boxShadow: loading 
              ? '0 2px 8px rgba(122, 0, 16, 0.5), 0 0 12px rgba(122, 0, 16, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 
              : 'none',
          }}
        >
          {/* Animated shimmer effect */}
          {loading && (
            <>
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent top-loading-shimmer"
                style={{
                  width: '40%',
                  transform: 'skewX(-20deg)',
                }}
              />
              
              {/* Secondary shimmer for depth */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent top-loading-shimmer-delayed"
                style={{
                  width: '30%',
                  transform: 'skewX(-20deg)',
                }}
              />
            </>
          )}
        </div>
      </div>
      
      {/* CSS Animation - injected via style tag */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes top-loading-shimmer {
            0% {
              transform: skewX(-20deg) translateX(-100%);
            }
            100% {
              transform: skewX(-20deg) translateX(400%);
            }
          }
          
          .top-loading-shimmer {
            animation: top-loading-shimmer 1.5s ease-in-out infinite;
          }
          
          .top-loading-shimmer-delayed {
            animation: top-loading-shimmer 2s ease-in-out infinite 0.3s;
          }
        `
      }} />
    </>
  );
}

/**
 * Hook to manually control the loading bar
 */
export function useTopLoadingBar() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const start = () => {
    setLoading(true);
    setProgress(0);
  };

  const set = (value: number) => {
    setProgress(Math.min(100, Math.max(0, value)));
  };

  const complete = () => {
    setProgress(100);
    setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 200);
  };

  const reset = () => {
    setLoading(false);
    setProgress(0);
  };

  return { start, set, complete, reset, loading, progress };
}

/**
 * Top Loading Bar wrapper with Suspense boundary
 */
export default function TopLoadingBar() {
  return (
    <Suspense fallback={null}>
      <TopLoadingBarContent />
    </Suspense>
  );
}

