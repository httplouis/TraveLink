"use client";

export default function TableHeader() {
  return (
    <thead className="sticky top-0 z-10">
      <tr className="bg-neutral-50/90 backdrop-blur supports-[backdrop-filter]:bg-neutral-50/60 text-neutral-600 text-xs font-semibold uppercase tracking-wide">
        <th className="px-4 py-3 w-[34px]">
          <input type="checkbox" className="accent-[#7a1f2a]" />
        </th>
        <th className="px-4 py-3 text-left">Vehicle</th>
        <th className="px-4 py-3 text-left hidden sm:table-cell">Type</th>
        <th className="px-4 py-3 text-left">Status</th>
        <th className="px-4 py-3 text-left hidden md:table-cell">Attachments</th>
        <th className="px-4 py-3 text-right hidden lg:table-cell">Cost</th>
        <th className="px-4 py-3 text-left hidden sm:table-cell">Date</th>
        <th className="px-4 py-3 text-left">Next Due</th>
        <th className="px-4 py-3 text-right">Actions</th>
      </tr>
    </thead>
  );
}
