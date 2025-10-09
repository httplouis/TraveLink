"use client";
import * as React from "react";
import type { RequestFormData } from "@/lib/user/request/types";


export default function SummarySidebar({ data, firstHop, path }: { data: RequestFormData; firstHop: string; path: string[]; }) {
return (
<aside className="rounded-2xl border bg-white p-4 shadow-sm">
<div className="text-sm font-semibold">Routing Preview</div>
<div className="mt-1 text-xs text-neutral-600">First receiver</div>
<div className="text-sm">{firstHop}</div>
<div className="mt-2 text-xs text-neutral-600">Full path</div>
<div className="text-sm leading-6">{path.join(" → ")}</div>


<div className="mt-4 text-sm font-semibold">Current Choices</div>
<dl className="mt-1 space-y-1 text-sm">
<Row name="Requester" value={data.requesterRole} />
<Row name="Reason" value={data.reason} />
<Row name="Vehicle" value={data.vehicleMode} />
</dl>


<div className="mt-4 text-xs text-neutral-600">Approvers (fixed)</div>
<ul className="mt-1 text-sm list-disc pl-5">
<li>Comptroller</li>
<li>HRD</li>
<li>VP/COO</li>
<li>TM close-out (if institutional)</li>
</ul>
</aside>
);
}


function Row({ name, value }: { name: string; value: React.ReactNode }) {
return (
<div className="grid grid-cols-[100px_1fr] items-start gap-2">
<div className="text-xs uppercase tracking-wide text-neutral-500">{name}</div>
<div className="text-sm">{value as any}</div>
</div>
);
}