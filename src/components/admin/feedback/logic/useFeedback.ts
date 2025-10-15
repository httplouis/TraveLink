// src/components/admin/feedback/logic/useFeedback.ts
"use client";
import * as React from "react";
import { FeedbackRepo } from "@/lib/admin/feedback/store";
import type { Feedback } from "@/lib/admin/feedback/types";

export function useFeedback() {
  const [rows, setRows] = React.useState<Feedback[]>([]);

  React.useEffect(() => {
    setRows(FeedbackRepo.list());
  }, []);

  const refresh = () => setRows(FeedbackRepo.list());

  return { rows, refresh };
}
