// components/common/form/FormSection.ui.tsx
"use client";
export function FormSection({
  title, children,
}: { title?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-white p-4 ring-1 ring-gray-200 shadow-sm">
      {title && <div className="mb-3 text-sm font-semibold">{title}</div>}
      <div className="grid gap-3">{children}</div>
    </section>
  );
}
