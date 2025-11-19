"use client";

import { useState, useEffect } from "react";
import SignaturePad from "./inputs/SignaturePad.ui";
import { CheckCircle2, Upload, X } from "lucide-react";

export default function SignatureSettings() {
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [loadingSignature, setLoadingSignature] = useState(true);

  useEffect(() => {
    loadSignature();
  }, []);

  const loadSignature = async () => {
    try {
      setLoadingSignature(true);
      const res = await fetch("/api/settings/signature");
      const data = await res.json();
      if (data.ok && data.data?.signature) {
        setSignature(data.data.signature);
      }
    } catch (err) {
      console.error("Failed to load signature:", err);
    } finally {
      setLoadingSignature(false);
    }
  };

  const handleSave = async (dataURL: string) => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/settings/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: dataURL }),
      });

      const data = await res.json();
      if (data.ok) {
        setSignature(dataURL);
        setMessage("Signature saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.error || "Failed to save signature");
      }
    } catch (err: any) {
      setMessage("Error saving signature: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    setLoading(true);
    setMessage("");

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataURL = e.target?.result as string;
        await handleSave(dataURL);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setMessage("Error uploading signature: " + (err.message || "Unknown error"));
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your saved signature?")) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/settings/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: null }),
      });

      const data = await res.json();
      if (data.ok) {
        setSignature(null);
        setMessage("Signature deleted successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.error || "Failed to delete signature");
      }
    } catch (err: any) {
      setMessage("Error deleting signature: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Digital Signature
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Save your signature here. When you need to sign a request, you can use your saved signature instead of signing each time.
        </p>
      </div>

      {loadingSignature ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#7A0010] border-r-transparent"></div>
          <p className="text-sm text-slate-600 mt-2">Loading signature...</p>
        </div>
      ) : signature ? (
        <div className="space-y-4">
          <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-900">Signature Saved</p>
                  <p className="text-xs text-green-700 mt-1">
                    Your signature is ready to use. Click "Use Saved Signature" when signing requests.
                  </p>
                </div>
              </div>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Delete signature"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-white">
            <p className="text-xs font-medium text-slate-600 mb-2">Current Signature:</p>
            <div className="border-2 border-slate-200 rounded-lg p-3 bg-slate-50">
              <img src={signature} alt="Current signature" className="h-24 mx-auto object-contain" />
            </div>
          </div>

          <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">Update Your Signature</p>
            <p className="text-xs text-blue-700 mb-4">
              Draw a new signature or upload an e-signature image to replace your current one.
            </p>
            <SignaturePad
              height={200}
              value={null}
              onSave={handleSave}
              onClear={() => {}}
              onUpload={handleUpload}
              hideSaveButton={false}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900 mb-1">No Signature Saved</p>
            <p className="text-xs text-amber-700">
              Create your signature below. You can draw it or upload an e-signature image file.
            </p>
          </div>

          <SignaturePad
            height={200}
            value={null}
            onSave={handleSave}
            onClear={() => {}}
            onUpload={handleUpload}
            hideSaveButton={false}
          />
        </div>
      )}

      {message && (
        <div className={`rounded-lg p-3 text-sm ${
          message.includes("success") || message.includes("deleted")
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}
