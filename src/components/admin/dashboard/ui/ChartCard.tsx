"use client";

import dynamic from "next/dynamic";
import * as React from "react";

type Props<T> = {
  title: string;
  type: "line" | "bar";
  data: T[];
  xKey: keyof T;
  yKey: keyof T;
  height?: number;           // chart drawing area height (px)
  description?: string;      // optional tiny helper text under title
  className?: string;        // optional wrapper override
};

// Lightweight skeleton while the chart bundle loads
const Recharts = dynamic(() => import("./_Recharts"), {
  ssr: false,
  loading: () => (
    <div className="mt-2 h-[220px] w-full animate-pulse rounded-lg bg-neutral-100" />
  ),
});

export default function ChartCard<T>({
  title,
  type,
  data,
  xKey,
  yKey,
  height = 240,
  description,
  className = "",
}: Props<T>) {
  const d = React.useMemo(() => data, [data]);
  const empty = !d || d.length === 0;

  return (
    <div
      className={
        "rounded-xl border border-neutral-200 bg-white p-4 shadow-sm " + className
      }
    >
      <div className="mb-2 flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold text-neutral-900">{title}</div>
          {description ? (
            <p className="mt-0.5 text-xs text-neutral-500">{description}</p>
          ) : null}
        </div>

        <span className="ml-3 inline-flex items-center rounded-full border border-neutral-200 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
          {type === "line" ? "Line" : "Bar"} Chart
        </span>
      </div>

      {/* Content */}
      <div
        className="relative mt-2 w-full"
        style={{ height }}
        aria-busy={empty ? undefined : false}
      >
        {empty ? (
          <EmptyState />
        ) : (
          <Recharts
            type={type}
            data={d as any}
            xKey={xKey as string}
            yKey={yKey as string}
            height={height}
          />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50">
      <div className="text-center">
        <div className="text-sm font-medium text-neutral-800">No data to display</div>
        <p className="mt-1 text-xs text-neutral-500">
          Try adjusting the date range or filters.
        </p>
      </div>
    </div>
  );
}
