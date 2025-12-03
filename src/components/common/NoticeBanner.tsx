"use client";
import * as React from "react";
import { Info, X } from "lucide-react";

interface Props {
  message?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export default function NoticeBanner({
  message = "A request should be approved 2 weeks prior to the travel date.",
  dismissible = true,
  onDismiss,
}: Props) {
  const [isVisible, setIsVisible] = React.useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded-r-lg">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-blue-800 font-medium">
            {message}
          </p>
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="text-blue-600 hover:text-blue-800 transition-colors flex-shrink-0"
            aria-label="Dismiss notice"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

