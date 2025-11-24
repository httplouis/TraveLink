// src/components/admin/feedback/logic/useFeedback.ts
"use client";
import * as React from "react";
import { FeedbackRepo } from "@/lib/admin/feedback/store";
import type { Feedback } from "@/lib/admin/feedback/types";

export function useFeedback() {
  const [rows, setRows] = React.useState<Feedback[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadFeedback() {
      try {
        setLoading(true);
        const data = await FeedbackRepo.list();
        setRows(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('[useFeedback] Error loading feedback:', error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    }
    loadFeedback();
  }, []);

  const refresh = async () => {
    try {
      const data = await FeedbackRepo.list();
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[useFeedback] Error refreshing feedback:', error);
      setRows([]);
    }
  };

  return { rows, refresh, loading };
}
