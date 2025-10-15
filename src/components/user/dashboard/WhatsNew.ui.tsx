"use client";

export default function WhatsNew() {
  const items = [
    { title: "Faster approvals", body: "Approvals board loads 2× faster.", date: "Oct 01" },
    { title: "Calendar upgrades", body: "Week view + Today button added.", date: "Sep 21" },
  ];
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="mb-2 text-sm font-medium text-gray-900">What’s new</div>
      <ul className="space-y-3">
        {items.map((n) => (
          <li key={n.title} className="rounded-lg border border-neutral-200/70 p-3">
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm text-neutral-900">{n.title}</div>
              <div className="text-xs text-neutral-500">{n.date}</div>
            </div>
            <div className="text-xs text-neutral-600 mt-1">{n.body}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
