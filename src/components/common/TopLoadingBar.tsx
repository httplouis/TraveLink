"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Top Loading Bar - Thin progress bar at the top of the page
 * Similar to nprogress but custom implementation
 */
function TopLoadingBarContent() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Reset loading on route change
    setLoading(true);
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        // Accelerate then slow down
        const increment = prev < 50 ? 10 : 5;
        return Math.min(prev + increment, 90);
      });
    }, 100);

    // Complete after a short delay
    const timeout = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
    }, 500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [pathname, searchParams]);

  if (!loading && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-0.5 bg-gradient-to-r from-[#7A0010] via-[#9A0020] to-[#7A0010] transition-all duration-300 ease-out"
      style={{
        width: `${progress}%`,
        opacity: loading ? 1 : 0,
        transform: `translateX(${progress === 100 ? "100%" : "0%"})`,
      }}
    >
      <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
    </div>
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

