// src/components/common/CommandPalette.tsx
"use client";
import { useEffect, useState } from "react";

type Action = { id: string; label: string; shortcut?: string; run: () => void };

export default function CommandPalette({ actions }: { actions: Action[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const metaK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
      if (metaK) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = actions.filter(a => a.label.toLowerCase().includes(q.toLowerCase()));

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div
        className="mx-auto mt-24 w-full max-w-lg rounded-2xl bg-white p-3 shadow-xl ring-1 ring-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          className="w-full rounded-xl border px-3 py-2 text-sm"
          placeholder="Type a command… (Esc to close)"
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        />
        <ul className="mt-2 max-h-64 overflow-y-auto">
          {filtered.length === 0 && <li className="p-3 text-sm text-neutral-500">No matches</li>}
          {filtered.map((a) => (
            <li key={a.id}>
              <button
                className="flex w-full items-center justify-between rounded-xl p-3 text-left text-sm hover:bg-neutral-50"
                onClick={() => { setOpen(false); a.run(); }}
              >
                <span>{a.label}</span>
                {a.shortcut && <kbd className="rounded border bg-neutral-50 px-1 text-xs text-neutral-600">{a.shortcut}</kbd>}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 text-right text-[11px] text-neutral-500">Tip: press ⌘K / Ctrl+K anytime</div>
      </div>
    </div>
  );
}
