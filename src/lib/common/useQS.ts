// src/lib/common/useQS.ts
"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Sync local state <q, sort> with the URL's ?q=&sort= (guarded to avoid loops).
 *
 * - On mount: reads ?q and ?sort then seeds setQ/setSort.
 * - On change: writes back to URL only if something actually changed
 *   compared to last snapshot (lastRef) to prevent ping-pong.
 */
export function useQS(
  q: string,
  sort: "asc" | "desc",
  setQ: (v: string) => void,
  setSort: (v: "asc" | "desc") => void
) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const lastRef = useRef("");

  // Read once on mount
  useEffect(() => {
    const initQ = sp.get("q") ?? "";
    const initSort = sp.get("sort") === "asc" ? "asc" : "desc";
    setQ(initQ);
    setSort(initSort);
    lastRef.current = `q=${initQ}&sort=${initSort}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Write (guarded)
  useEffect(() => {
    const nextKey = `q=${q}&sort=${sort}`;
    if (nextKey === lastRef.current) return;

    const nextSP = new URLSearchParams(sp.toString());
    const qTrim = q.trim();
    if (qTrim) nextSP.set("q", qTrim);
    else nextSP.delete("q");
    nextSP.set("sort", sort);

    lastRef.current = nextKey;
    router.replace(`${pathname}?${nextSP.toString()}`);
  }, [q, sort, router, pathname, sp]);
}
