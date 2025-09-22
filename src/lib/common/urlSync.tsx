"use client";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type WithQS = { q?: string; sort?: string };
type Props<TDraft extends Record<string, any>> = {
  read: (p: URLSearchParams) => Partial<TDraft & WithQS>;
  write: (draft: TDraft & WithQS) => URLSearchParams;
  draft: TDraft & WithQS;
  onDraftChange: (patch: Partial<TDraft & WithQS>) => void;
};

export function URLSync<TDraft extends Record<string, any>>({
  read, write, draft, onDraftChange
}: Props<TDraft>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const didInit = React.useRef(false);
  const lastQS = React.useRef<string | null>(null);

  // Normalize pathname to a non-null string
  const safePath = React.useMemo(() => pathname ?? "/", [pathname]);

  // 1) Read once from URL and patch draft
  React.useEffect(() => {
    const patch = read(new URLSearchParams((searchParams?.toString() ?? "") as string));
    if (Object.keys(patch).length) onDraftChange(patch);
    didInit.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Whenever draft changes, write to URL — only if QS actually changed
  React.useEffect(() => {
    if (!didInit.current) return;
    const params = write(draft);
    const qs = params.toString();
    if (lastQS.current === qs) return; // prevent update loop
    lastQS.current = qs;
    router.replace(qs ? `${safePath}?${qs}` : safePath, { scroll: false });
  }, [draft, safePath, router, write]);

  return null;
}
