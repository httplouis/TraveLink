// src/lib/admin/requests/useRequestsFromSupabase.ts
"use client";

import useSWR from "swr";

type SupabaseRequestRecord = {
  id: string;
  current_status: string;
  payload: any;
  created_at: string;
  updated_at: string;
};

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

export function useRequestsFromSupabase() {
  const { data, error, isLoading } = useSWR<{ ok: boolean; data: SupabaseRequestRecord[] }>(
    "/api/requests/list",
    fetcher
  );

  return {
    loading: isLoading,
    error,
    // kung walang data / error → empty array
    requests: data?.data ?? [],
  };
}
