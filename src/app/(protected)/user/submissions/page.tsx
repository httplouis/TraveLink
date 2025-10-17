"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  listSubmissions,
  cancelSubmission,
  getSubmission,
  type Submission,
} from "@/lib/user/request/mockApi";
import { useRequestStore } from "@/store/user/requestStore";
import { PageHeader, PageBody } from "@/components/common/Page";
import Card from "@/components/common/Card";
import EmptyState from "@/components/common/ui/EmptyState.ui";
import { useConfirm } from "@/components/common/hooks/useConfirm";
import { useToast } from "@/components/common/ui/ToastProvider.ui";
import { saveHandoff } from "@/lib/user/request/persist";
import BackToRequestButton from "@/components/common/buttons/BackToRequestButton.ui";

function StatusChip({ s }: { s: Submission["status"] }) {
  const cls =
    s === "pending"
      ? "bg-amber-100 text-amber-800"
      : s === "approved"
      ? "bg-emerald-100 text-emerald-800"
      : "bg-rose-100 text-rose-800";
  return <span className={`rounded-full px-2 py-0.5 text-xs ${cls}`}>{s}</span>;
}

export default function SubmissionsPage() {
  const [subs, setSubs] = React.useState<Submission[]>([]);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  const { hardSet, setCurrentSubmissionId, clearIds } = useRequestStore();
  const { ask, ui: confirmUI } = useConfirm();
  const toast = useToast();

  const refresh = React.useCallback(async () => {
    const rows = await listSubmissions();
    setSubs(rows);
  }, []);

  React.useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  async function onEdit(id: string) {
    const s = await getSubmission(id);
    if (!s) return;
    if (s.status !== "pending") {
      toast({
        kind: "info",
        title: "Locked",
        message: "Only pending submissions can be edited.",
      });
      return;
    }

    // Hydrate store (nice-to-have)
    hardSet(s.data);
    clearIds();
    setCurrentSubmissionId(id);

    // Write session handoff so Request page can consume reliably
    saveHandoff({ data: s.data, from: "submission", id });

    toast({
      kind: "info",
      title: "Editing submission",
      message: "Loaded into the form.",
    });

    // Also include the id in URL as a fallback
    router.push(`/user/request?submission=${encodeURIComponent(id)}`);
  }

  async function onCancel(id: string) {
    const yes = await ask(
      "Cancel submission?",
      "This will set the status to cancelled.",
      "Cancel submission",
      "Keep"
    );
    if (!yes) return;

    try {
      await cancelSubmission(id);
      await refresh();
      toast({
        kind: "success",
        title: "Cancelled",
        message: "Submission was cancelled.",
      });
    } catch (e: any) {
      toast({
        kind: "info",
        title: "Cannot cancel",
        message: e?.message || "The request was already received by Admin.",
      });
    }
  }

  return (
    <>
      <PageHeader
        title="Submission History"
        actions={<BackToRequestButton />}
      />

      <PageBody>
        {loading ? (
          <Card title="Loading">
            <div className="text-sm text-neutral-600">Loading…</div>
          </Card>
        ) : subs.length === 0 ? (
          <EmptyState
            title="No submissions yet"
            description="Submit your travel request to see it here."
            action={
              <Link
                href="/user/request"
                className="rounded-md bg-[#7A0010] px-3 py-1.5 text-sm text-white"
              >
                Create a request
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3">
            {subs.map((s) => (
              <Card key={s.id} title={s.title}>
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="text-xs text-neutral-600">
                    Created: {new Date(s.createdAt).toLocaleString()} • Updated:{" "}
                    {new Date(s.updatedAt).toLocaleString()}
                    <div className="mt-1">
                      First receiver:{" "}
                      <span className="font-medium">{s.firstReceiver}</span> •
                      Path: {s.approvalPath.join(" → ")}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusChip s={s.status} />
                    <button
                      onClick={() => onEdit(s.id)}
                      disabled={s.status !== "pending"}
                      className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-neutral-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onCancel(s.id)}
                      disabled={s.status !== "pending"}
                      className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-neutral-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageBody>

      {confirmUI}
    </>
  );
}
