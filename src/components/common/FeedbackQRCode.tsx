// src/components/common/FeedbackQRCode.tsx
/**
 * Feedback QR Code Component
 * Generates and displays QR code for student feedback links
 */

"use client";

import React from "react";
import { QrCode, Copy, Check, Share2 } from "lucide-react";
import { motion } from "framer-motion";

interface FeedbackQRCodeProps {
  url: string;
  requestNumber: string;
  onCopy?: () => void;
}

export default function FeedbackQRCode({
  url,
  requestNumber,
  onCopy
}: FeedbackQRCodeProps) {
  const [copied, setCopied] = React.useState(false);
  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);

  // Generate QR code on mount
  React.useEffect(() => {
    const generateQR = async () => {
      try {
        // Use dynamic import for QR code library
        const QRCode = (await import("qrcode")).default;
        const dataUrl = await QRCode.toDataURL(url, {
          width: 256,
          margin: 2,
          color: {
            dark: "#7A0010",
            light: "#FFFFFF"
          }
        });
        setQrDataUrl(dataUrl);
      } catch (error) {
        console.error("[Feedback QR] Failed to generate QR code:", error);
      }
    };

    generateQR();
  }, [url]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("[Feedback QR] Failed to copy:", error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Feedback for ${requestNumber}`,
          text: `Please provide feedback for trip ${requestNumber}`,
          url: url
        });
      } catch (error) {
        // User cancelled or error
        console.error("[Feedback QR] Share failed:", error);
      }
    } else {
      // Fallback to copy
      handleCopy();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 space-y-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <QrCode className="h-5 w-5 text-[#7A0010]" />
        <h3 className="font-semibold text-gray-900">Share Feedback Link</h3>
      </div>

      {/* QR Code */}
      {qrDataUrl ? (
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
            <img src={qrDataUrl} alt="QR Code" className="w-64 h-64" />
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-64 bg-gray-100 rounded-lg">
          <div className="animate-spin h-8 w-8 border-4 border-[#7A0010] border-t-transparent rounded-full"></div>
        </div>
      )}

      {/* URL */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-700">Feedback Link</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={url}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
          />
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
            title="Copy link"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-xs text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-gray-600" />
                <span className="text-xs text-gray-600">Copy</span>
              </>
            )}
          </button>
          {navigator.share && (
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-[#7A0010] hover:bg-[#9c2a3a] text-white rounded-lg transition-colors flex items-center gap-2"
              title="Share link"
            >
              <Share2 className="h-4 w-4" />
              <span className="text-xs">Share</span>
            </button>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-900">
          <strong>For Students:</strong> Scan the QR code or use the link above to provide anonymous feedback about your trip experience.
        </p>
      </div>
    </motion.div>
  );
}

