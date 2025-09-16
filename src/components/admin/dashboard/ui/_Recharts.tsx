"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";

type Props = {
  type: "line" | "bar";
  data: Array<Record<string, any>>;
  xKey: string;
  yKey: string;
  height?: number;
};

/* ---- Design tokens (tweak here) ---- */
const TOKENS = {
  color: {
    primary: "#7A0010",           // maroon
    axis: "#525252",              // neutral-600
    grid: "#E5E7EB",              // neutral-200
    legend: "#111827",            // neutral-900
    tooltipBg: "#FFFFFF",
    tooltipBorder: "#E5E7EB",
  },
  font: {
    axisSize: 12,
    legendSize: 12,
    tooltipSize: 12,
    tickWeight: 500,
    legendWeight: 600,
  },
  chart: {
    gridDash: "3 3",
    lineWidth: 2.5,
    dotR: 3,
    activeDotR: 5,
    barRadius: 6,
    barGap: 8,
    barCategoryGap: 24,
    leftPadding: 8,
  },
};

export default function RechartsBridge({
  type,
  data,
  xKey,
  yKey,
  height = 240,
}: Props) {
  const margin = { top: 8, right: 12, bottom: 8, left: TOKENS.chart.leftPadding };

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        {type === "line" ? (
          <LineChart data={data} margin={margin}>
            <CartesianGrid strokeDasharray={TOKENS.chart.gridDash} stroke={TOKENS.color.grid} />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: TOKENS.font.axisSize, fill: TOKENS.color.axis, fontWeight: TOKENS.font.tickWeight }}
              axisLine={{ stroke: TOKENS.color.grid }}
              tickLine={{ stroke: TOKENS.color.grid }}
              interval="preserveStartEnd"
              minTickGap={18}
            />
            <YAxis
              width={36}
              tick={{ fontSize: TOKENS.font.axisSize, fill: TOKENS.color.axis, fontWeight: TOKENS.font.tickWeight }}
              axisLine={{ stroke: TOKENS.color.grid }}
              tickLine={{ stroke: TOKENS.color.grid }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: TOKENS.color.tooltipBg,
                border: `1px solid ${TOKENS.color.tooltipBorder}`,
                borderRadius: 8,
                boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                fontSize: TOKENS.font.tooltipSize,
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 6 }}
              formatter={(v) => (
                <span style={{ fontSize: TOKENS.font.legendSize, fontWeight: TOKENS.font.legendWeight, color: TOKENS.color.legend }}>
                  {v}
                </span>
              )}
            />
            <Line
              type="monotone"
              dataKey={yKey}
              stroke={TOKENS.color.primary}
              strokeWidth={TOKENS.chart.lineWidth}
              dot={{ r: TOKENS.chart.dotR, stroke: TOKENS.color.primary }}
              activeDot={{ r: TOKENS.chart.activeDotR }}
            />
          </LineChart>
        ) : (
          <BarChart data={data} margin={margin} barGap={TOKENS.chart.barGap} barCategoryGap={TOKENS.chart.barCategoryGap}>
            <CartesianGrid strokeDasharray={TOKENS.chart.gridDash} stroke={TOKENS.color.grid} />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: TOKENS.font.axisSize, fill: TOKENS.color.axis, fontWeight: TOKENS.font.tickWeight }}
              axisLine={{ stroke: TOKENS.color.grid }}
              tickLine={{ stroke: TOKENS.color.grid }}
              interval="preserveStartEnd"
              minTickGap={18}
            />
            <YAxis
              width={36}
              tick={{ fontSize: TOKENS.font.axisSize, fill: TOKENS.color.axis, fontWeight: TOKENS.font.tickWeight }}
              axisLine={{ stroke: TOKENS.color.grid }}
              tickLine={{ stroke: TOKENS.color.grid }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: TOKENS.color.tooltipBg,
                border: `1px solid ${TOKENS.color.tooltipBorder}`,
                borderRadius: 8,
                boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                fontSize: TOKENS.font.tooltipSize,
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 6 }}
              formatter={(v) => (
                <span style={{ fontSize: TOKENS.font.legendSize, fontWeight: TOKENS.font.legendWeight, color: TOKENS.color.legend }}>
                  {v}
                </span>
              )}
            />
            <Bar dataKey={yKey} fill={TOKENS.color.primary} radius={[TOKENS.chart.barRadius, TOKENS.chart.barRadius, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
