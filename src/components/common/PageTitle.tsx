"use client";

import { useEffect } from "react";

interface PageTitleProps {
  title: string;
}

/**
 * Component to set browser tab title dynamically
 * Usage: <PageTitle title="TraviLink | Faculty" />
 */
export default function PageTitle({ title }: PageTitleProps) {
  useEffect(() => {
    // Set title immediately
    document.title = title;
    
    // Create a persistent observer to maintain the title
    const observer = new MutationObserver(() => {
      if (document.title !== title) {
        document.title = title;
      }
    });
    
    // Observe changes to the document title
    observer.observe(document.querySelector('title') || document.head, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    
    // Also set up interval as backup
    const interval = setInterval(() => {
      if (document.title !== title) {
        document.title = title;
      }
    }, 100);
    
    // Cleanup
    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, [title]);

  return null; // This component doesn't render anything
}
