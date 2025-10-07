"use client";

type Tab = "calendar" | "upcoming";

export default function ScheduleTabs({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <div className="mx-auto mb-3 max-w-6xl px-2">
      <div className="inline-flex overflow-hidden rounded-xl ring-1 ring-neutral-300">
        <TabBtn active={active === "calendar"} onClick={() => onChange("calendar")}>
          Calendar
        </TabBtn>
        <TabBtn active={active === "upcoming"} onClick={() => onChange("upcoming")}>
          Upcoming Requests
        </TabBtn>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? "bg-white px-3 py-1.5 text-sm font-medium text-[#7A0010]"
          : "bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-200"
      }
    >
      {children}
    </button>
  );
}
