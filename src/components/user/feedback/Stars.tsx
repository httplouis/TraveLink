"use client";

export default function Stars({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
          onClick={() => onChange(i === value ? 0 : i)}
          className={`h-8 w-8 grid place-items-center rounded hover:bg-neutral-100 ${
            i <= value ? "text-amber-500" : "text-neutral-300"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.786 1.401 8.163L12 18.897l-7.335 3.863 1.401-8.163L.132 9.211l8.2-1.193z" />
          </svg>
        </button>
      ))}
    </div>
  );
}
