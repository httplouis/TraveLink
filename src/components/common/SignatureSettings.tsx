"use client";

import { useRef, useState, useEffect } from "react";

export default function SignatureSettings() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/signature")
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.signature) {
          setSignature(data.signature);
        }
      });
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setMessage("");
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setMessage("");
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setLoading(true);
    const dataURL = canvas.toDataURL();

    try {
      const res = await fetch("/api/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: dataURL }),
      });

      const data = await res.json();
      if (data.ok) {
        setSignature(dataURL);
        setMessage("Signature saved successfully!");
      } else {
        setMessage("Failed to save signature");
      }
    } catch {
      setMessage("Error saving signature");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Digital Signature
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Draw your signature below. This will be automatically applied when you approve requests.
        </p>
      </div>

      {signature && (
        <div className="mb-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Current Signature:</p>
          <div className="border rounded-lg p-4 bg-white inline-block">
            <img src={signature} alt="Current signature" className="h-20" />
          </div>
        </div>
      )}

      <div className="border-2 border-slate-300 rounded-lg bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          width={600}
          height={160}
          className="w-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleClear}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
        >
          Clear
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-[#7A0010] rounded-md hover:bg-[#69000d] disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Signature"}
        </button>
      </div>

      {message && (
        <p className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
