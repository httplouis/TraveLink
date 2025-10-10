// src/app/(protected)/user/drafts/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  listDrafts,
  getDraft,
  deleteDraft,
  type Draft,
} from "@/lib/user/request/mockApi";
import { useRequestStore } from "@/store/user/requestStore";

import { PageHeader, PageBody } from "@/components/common/Page";
import Card from "@/components/common/Card";
import EmptyState from "@/components/common/ui/EmptyState.ui";
import { useConfirm } from "@/components/common/hooks/useConfirm";
import { useToast } from "@/components/common/ui/ToastProvider.ui";
import { saveHandoff } from "@/lib/user/request/persist";
import BackToRequestButton from "@/components/common/buttons/BackToRequestButton.ui";

export default function DraftsPage() {
  const [drafts, setDrafts] = React.useState<Draft[]>([]);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  const { hardSet, setCurrentDraftId, clearIds } = useRequestStore();
  const { ask, ui: confirmUI } = useConfirm();
  const toast = useToast();

  React.useEffect(() => {
    listDrafts()
      .then(setDrafts)
      .finally(() => setLoading(false));
  }, []);

  async function handleLoad(id: string) {
    const d = await getDraft(id);
    if (!d) return;

    // Hydrate store (nice-to-have)
    hardSet(d.data);
    clearIds();
    setCurrentDraftId(id);

    // Session handoff (primary) + URL fallback
    saveHandoff({ data: d.data, from: "draft", id });
    toast({
      kind: "success",
      title: "Draft loaded",
      message: "Draft is now in the form.",
    });

    router.push(`/user/request?draft=${encodeURIComponent(id)}`);
  }

  async function handleDelete(id: string) {
    const yes = await ask(
      "Delete draft?",
      "This action cannot be undone.",
      "Delete",
      "Cancel"
    );
    if (!yes) return;

    await deleteDraft(id);
    setDrafts(await listDrafts());
    toast({
      kind: "success",
      title: "Draft deleted",
      message: "Draft removed.",
    });
  }

  return (
    <>
      <PageHeader title="Saved Drafts" actions={<BackToRequestButton />} />
      <PageBody>
        {loading ? (
          <Card title="Loading">
            <div className="text-sm text-neutral-600">Loading…</div>
          </Card>
        ) : drafts.length === 0 ? (
          <EmptyState
            title="No drafts yet"
            description="Save your progress as a draft and resume later."
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
            {drafts.map((d) => (
              <Card key={d.id} title={d.title}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-neutral-500">
                    Updated: {new Date(d.updatedAt).toLocaleString()}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLoad(d.id)}
                      className="rounded-md bg-[#7A0010] px-3 py-1.5 text-sm text-white"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50"
                    >
                      Delete
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
