"use client";
import { LineChart, Line, ResponsiveContainer } from "recharts";

export default function Sparkline({
  data,
  color = "#7A0010", // brand maroon
}: {
  data: number[];
  color?: string;
}) {
  const rows = data.map((y, i) => ({ x: i, y }));
  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 6, right: 6, bottom: 0, left: 6 }}>
          <Line
            type="monotone"
            dataKey="y"
            dot={false}
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
