"use client";

export default function Legend() {
  return (
    <div className="flex items-center gap-4 text-xs text-gray-600">
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Available
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> Partial
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span> Full
      </span>
    </div>
  );
}
