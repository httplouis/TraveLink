// src/components/user/dashboard/ActivityTimeline.ui.tsx
"use client";

type Item = { id: string; when: string; title: string; meta: string };

export default function ActivityTimeline({ items }: { items: Item[] }) {
  if (!items.length) return null;
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="mb-2 text-sm font-medium text-gray-900">Recent activity</div>
      <ul className="space-y-4">
        {items.map((it, i) => (
          <li key={it.id} className="relative pl-6">
            <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-[#7A0010]" />
            {i !== items.length - 1 && (
              <span className="absolute left-1.5 top-5 h-full w-[2px] bg-neutral-200" />
            )}
            <div className="text-sm font-medium text-neutral-900">{it.title}</div>
            <div className="text-xs text-neutral-600">{it.meta}</div>
            <div className="mt-0.5 text-[11px] text-neutral-500">{it.when}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
