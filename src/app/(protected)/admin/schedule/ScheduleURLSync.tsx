"use client";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Sort = "newest" | "oldest";

type Props = {
  q: string;
  sort: Sort;
  onQ: (next: string) => void;
  onSort: (next: Sort) => void;
};

/** Syncs ?q= and ?sort=asc|desc with local state (newest↔desc, oldest↔asc) */
export default function ScheduleURLSync({ q, sort, onQ, onSort }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // read once
  React.useEffect(() => {
    const sp = searchParams ?? new URLSearchParams();
    const q0 = sp.get("q") ?? "";
    const s0 = sp.get("sort") as "asc" | "desc" | null;
    if (q0 !== q) onQ(q0);
    if (s0 === "asc") onSort("oldest");
    if (s0 === "desc") onSort("newest");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // write when q/sort change
  React.useEffect(() => {
    const sp = new URLSearchParams(searchParams?.toString() ?? "");
    q ? sp.set("q", q) : sp.delete("q");
    const dir = sort === "oldest" ? "asc" : "desc";
    sp.set("sort", dir);
    router.replace(`${pathname}?${sp.toString()}`);
  }, [q, sort, pathname, router, searchParams]);

  return null;
}
