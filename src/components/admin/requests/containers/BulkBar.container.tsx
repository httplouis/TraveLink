"use client";
import React, { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { RequestRow } from "@/lib/admin/types";
import BulkBarUI from "@/components/admin/requests/ui/BulkBar.ui";
import ConfirmUI from "@/components/admin/requests/ui/Confirm.ui";

type Props = {
  allRows: RequestRow[];
  selectedIds: Set<string>;
  clearSelection: () => void;

  onApproveSelected: (ids: string[]) => Promise<void> | void;
  onRejectSelected: (ids: string[]) => Promise<void> | void;
  onDeleteSelected: (ids: string[]) => Promise<void> | void;
  onExportSelected: (rows: RequestRow[]) => void;
};

export type BulkBarHandle = {
  approveSelected: () => void;
  rejectSelected: () => void;
  deleteSelected: () => void;
  exportSelected: () => void;
  clear: () => void;
};

type BusyKind = "approve" | "reject" | "delete" | null;

function BulkBarContainerInner(
  { allRows, selectedIds, clearSelection, onApproveSelected, onRejectSelected, onDeleteSelected, onExportSelected }: Props,
  ref: React.Ref<BulkBarHandle>
) {
  const ids = useMemo(() => [...selectedIds], [selectedIds]);
  const selectedRows = useMemo(() => allRows.filter((r) => selectedIds.has(r.id)), [allRows, selectedIds]);
  const selectedCount = ids.length;

  const breakdown: Record<string, number> = useMemo(() => {
    const b: Record<string, number> = {};
    selectedRows.forEach((r) => (b[r.status] = (b[r.status] ?? 0) + 1));
    return b;
  }, [selectedRows]);

  const [confirm, setConfirm] = useState<{ open: boolean; kind?: "reject" | "delete" }>({ open: false });
  const [busy, setBusy] = useState<BusyKind>(null);

  async function doApprove() {
    if (!ids.length || busy) return;
    try {
      setBusy("approve");
      await onApproveSelected(ids);
      clearSelection();
    } finally {
      setBusy(null);
    }
  }

  async function doConfirm(kind: "reject" | "delete") {
    if (!ids.length || busy) return;
    try {
      setBusy(kind);
      if (kind === "reject") await onRejectSelected(ids);
      if (kind === "delete") await onDeleteSelected(ids);
      clearSelection();
    } finally {
      setBusy(null);
      setConfirm({ open: false });
    }
  }

  useImperativeHandle(ref, () => ({
    approveSelected: doApprove,
    rejectSelected: () => setConfirm({ open: true, kind: "reject" }),
    deleteSelected: () => setConfirm({ open: true, kind: "delete" }),
    exportSelected: () => onExportSelected(selectedRows),
    clear: clearSelection,
  }));

  return (
    <>
      <BulkBarUI
        selectedCount={selectedCount}
        breakdown={breakdown}
        onApprove={doApprove}
        onReject={() => setConfirm({ open: true, kind: "reject" })}
        onDelete={() => setConfirm({ open: true, kind: "delete" })}
        onExport={() => onExportSelected(selectedRows)}
        onClear={clearSelection}
        busy={busy}
      />

      <ConfirmUI
        open={confirm.open}
        title={confirm.kind === "delete" ? "Delete selected requests?" : "Reject selected requests?"}
        message={
          confirm.kind === "delete"
            ? `This will permanently remove ${selectedCount} ${selectedCount === 1 ? "request" : "requests"}.`
            : `This will mark ${selectedCount} ${selectedCount === 1 ? "request" : "requests"} as Rejected.`
        }
        confirmText={confirm.kind === "delete" ? "Delete" : "Reject"}
        confirmClass="bg-red-600 text-white"
        onCancel={() => setConfirm({ open: false })}
        onConfirm={() => doConfirm(confirm.kind!)}
      />
    </>
  );
}

const BulkBarContainer = forwardRef<BulkBarHandle, Props>(BulkBarContainerInner);
export default BulkBarContainer;
