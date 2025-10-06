"use client";

import { useState } from "react";
import BigCalendarView from "./BigCalendarView.ui";
import type { Trip } from "@/lib/user/schedule/types";

type Props = {
  trips: Trip[];
  onSelectDay: (d: Date) => void;
};

export default function BigCalendarContainer({ trips, onSelectDay }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handlePrev = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNext = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const handlePickMonth = (m: number) =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), m, 1));

  return (
    <BigCalendarView
      year={currentMonth.getFullYear()}
      month={currentMonth.getMonth()}
      trips={trips}
      onPrev={handlePrev}
      onNext={handleNext}
      onPickMonth={handlePickMonth}
      onSelectDay={onSelectDay}
    />
  );
}
