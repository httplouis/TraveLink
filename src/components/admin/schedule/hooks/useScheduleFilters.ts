"use client";
import * as React from "react";
import {
  DEFAULT_SCH_FILTERS,
  type ScheduleFilterState,
} from "@/lib/admin/schedule/filters";

export function useScheduleFilters(
  initial: ScheduleFilterState = DEFAULT_SCH_FILTERS
) {
  const [applied, setApplied] =
    React.useState<ScheduleFilterState>(initial);
  const [draft, setDraft] =
    React.useState<ScheduleFilterState>(initial);

  const update = React.useCallback(
    (next: Partial<ScheduleFilterState>) => {
      const n = { ...draft, ...next };
      setDraft(n);
      if (n.mode === "auto") setApplied(n);
    },
    [draft]
  );

  const apply = React.useCallback(() => setApplied(draft), [draft]);
  const clearAll = React.useCallback(() => {
    setDraft(DEFAULT_SCH_FILTERS);
    setApplied(DEFAULT_SCH_FILTERS);
  }, []);

  return { draft, applied, update, apply, clearAll, setDraft };
}
