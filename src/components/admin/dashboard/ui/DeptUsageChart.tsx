"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

type Point = { dept: string; count: number };

const COLORS = ["#7A0010", "#952035", "#B24158", "#CF6E85", "#E5A7B3"];

const TOKENS = {
  legendSize: 12,
  legendWeight: 600,
  labelSize: 12,
  labelColor: "#334155",     // neutral-700
  gapStroke: "#ffffff",
  gapWidth: 2,
};

export default function DeptUsageChart({ data }: { data: Point[] }) {
  const total = React.useMemo(
    () => data.reduce((s, d) => s + (d.count || 0), 0),
    [data]
  );

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold text-neutral-900">Department Usage</div>
        <span className="rounded-full border border-neutral-200 px-2 py-0.5 text-[11px] text-neutral-600">
          Donut Chart
        </span>
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer>
          <PieChart margin={{ top: 6, right: 18, bottom: 6, left: 18 }}>
            {/* Donut */}
            <Pie
              data={data}
              dataKey="count"
              nameKey="dept"
              cx="50%"
              cy="50%"
              innerRadius={58}        // thicker ring
              outerRadius={90}
              startAngle={90}
              endAngle={-270}
              minAngle={6}            // avoid ultra-thin slices
              paddingAngle={1.5}
              label={renderValueLabel}           // custom numeric labels
              labelLine={{ length: 24, length2: 14 }}
              isAnimationActive={false}
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={COLORS[i % COLORS.length]}
                  stroke={TOKENS.gapStroke}
                  strokeWidth={TOKENS.gapWidth}
                />
              ))}
            </Pie>

            {/* Center total */}
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-neutral-900"
              style={{ fontSize: 14, fontWeight: 700 }}
            >
              {total}
            </text>
            <text
              x="50%"
              y="50%"
              dy={16}
              textAnchor="middle"
              dominantBaseline="hanging"
              className="fill-neutral-500"
              style={{ fontSize: 11, fontWeight: 500 }}
            >
              total
            </text>

            <Tooltip
              contentStyle={{
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                fontSize: 12,
              }}
              formatter={(v: number, _name: string, i: any) => {
                const pct = total ? `${((v / total) * 100).toFixed(1)}%` : "0%";
                const dept = data[i?.payload?.index || 0]?.dept ?? "";
                return [v, `${dept} • ${pct}`];
              }}
            />

            <Legend
              verticalAlign="bottom"
              height={28}
              wrapperStyle={{ paddingTop: 8 }}
              formatter={(val: string) => (
                <span style={{ fontSize: TOKENS.legendSize, fontWeight: TOKENS.legendWeight, color: "#111827" }}>
                  {val}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Pushes numbers farther away from the arc; hides labels for very small slices */
function renderValueLabel(props: any) {
  const { cx, cy, midAngle, outerRadius, value, percent } = props;
  if (percent < 0.06) return null; // hide labels under ~6% to avoid clutter

  const RAD = Math.PI / 180;
  const r = outerRadius + 28; // farther offset so hindi dikit sa line
  const x = cx + r * Math.cos(-midAngle * RAD);
  const y = cy + r * Math.sin(-midAngle * RAD);

  return (
    <text
      x={x}
      y={y}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      style={{ fontSize: TOKENS.labelSize, fill: TOKENS.labelColor, fontWeight: 500 }}
    >
      {value}
    </text>
  );
}
