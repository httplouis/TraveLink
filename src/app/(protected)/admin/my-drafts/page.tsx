// src/app/(protected)/admin/my-drafts/page.tsx
"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Clock, Trash2, Loader2, ArrowRight, Calendar, AlertCircle, Plus } from "lucide-react";
import { motion } from "framer-motion";

import {
  listDrafts,
  getDraft,
  deleteDraft,
  type Draft,
} from "@/lib/user/request/mockApi";
import { useRequestStore } from "@/store/user/requestStore";

import EmptyState from "@/components/common/ui/EmptyState.ui";
import { useConfirm } from "@/components/common/hooks/useConfirm";
import { useToast } from "@/components/common/ui/ToastProvider.ui";
import { saveHandoff } from "@/lib/user/request/persist";

function AdminDraftsPageContent() {
  const [drafts, setDrafts] = React.useState<Draft[]>([]);
  const [dbDrafts, setDbDrafts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestIdParam = searchParams?.get("requestId") ?? null;
  const [highlightedId, setHighlightedId] = React.useState<string | null>(null);

  const { hardSet, setCurrentDraftId, clearIds } = useRequestStore();
  const { ask, ui: confirmUI } = useConfirm();
  const toast = useToast();

  React.useEffect(() => {
    loadDrafts();
  }, []);

  React.useEffect(() => {
    if (requestIdParam) {
      setHighlightedId(requestIdParam);
      setTimeout(() => {
        const element = document.getElementById(`draft-${requestIdParam}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
    }
  }, [requestIdParam]);

  async function loadDrafts() {
    try {
      setLoading(true);
      
      const localDrafts = await listDrafts();
      setDrafts(localDrafts);

      try {
        const res = await fetch("/api/user/drafts");
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.data) {
            setDbDrafts(data.data);
          }
        }
      } catch (err) {
        console.error("Failed to load database drafts:", err);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLoad(id: string) {
    const d = await getDraft(id);
    if (!d) return;

    hardSet(d.data);
    clearIds();
    setCurrentDraftId(id);

    saveHandoff({ data: d.data, from: "draft", id });
    toast({
      kind: "success",
      title: "Draft loaded",
      message: "Draft is now in the form.",
    });

    router.push(`/admin/my-request?draft=${encodeURIComponent(id)}`);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#7A0010] to-[#9c2a3a] rounded-xl text-white">
              <FileText className="h-6 w-6" />
            </div>
            My Drafts
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Continue working on your saved draft requests
          </p>
        </div>
        <Link
          href="/admin/my-request"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7A0010] to-[#9c2a3a] text-white rounded-lg hover:shadow-lg transition-all font-medium"
        >
          <Plus className="h-4 w-4" />
          New Request
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-sm"
        >
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-[#7A0010]" />
            <span className="text-sm font-medium text-gray-600">Loading drafts...</span>
          </div>
        </motion.div>
      ) : drafts.length === 0 && dbDrafts.length === 0 ? (
        <EmptyState
          title="No drafts yet"
          description="Save your progress as a draft and resume later."
          action={
            <Link
              href="/admin/my-request"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7A0010] to-[#5A0010] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
            >
              <FileText className="h-4 w-4" />
              Create a request
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {requestIdParam && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4 flex items-center gap-3"
            >
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Your request has been returned for revision. Please review the feedback, make necessary changes, and resubmit.
              </p>
            </motion.div>
          )}

          {dbDrafts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                {dbDrafts.some(d => d.status === 'returned') ? 'Returned for Revision' : 'Saved Drafts'}
              </h3>
              <div className="grid gap-4 mb-6">
                {dbDrafts.map((d, index) => {
                  const isHighlighted = highlightedId === d.id;
                  return (
                    <motion.div
                      key={d.id}
                      id={`draft-${d.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`group rounded-2xl border-2 ${
                        isHighlighted 
                          ? "border-[#7A0010] bg-red-50 shadow-lg" 
                          : "border-gray-200 bg-gradient-to-br from-white via-gray-50/30 to-white"
                      } p-6 shadow-sm transition-all duration-200 hover:border-[#7A0010]/30 hover:shadow-md`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="flex-shrink-0 mt-1 rounded-lg bg-gradient-to-br from-[#7A0010]/10 to-[#7A0010]/5 p-2.5">
                              <FileText className="h-5 w-5 text-[#7A0010]" strokeWidth={2} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
                                  {d.title || d.purpose || "Untitled Request"}
                                </h3>
                                {d.request_number && (
                                  <span className="text-xs font-medium text-gray-500">
                                    {d.request_number}
                                  </span>
                                )}
                              </div>
                              {d.status === 'returned' && (
                                <div className="mb-2 rounded-lg bg-amber-100 border border-amber-300 p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <AlertCircle className="h-4 w-4 text-amber-600" />
                                    <p className="text-xs font-semibold text-amber-800">Returned for Revision</p>
                                  </div>
                                  {d.return_reason && (
                                    <p className="text-xs text-amber-700 ml-6">{d.return_reason}</p>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" strokeWidth={2} />
                                  <span>Updated {formatDate(d.updated_at)}</span>
                                </div>
                                {d.destination && (
                                  <>
                                    <span>•</span>
                                    <span className="line-clamp-1">{d.destination}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              router.push(`/admin/my-request?requestId=${d.id}`);
                            }}
                            className={`group/load inline-flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold shadow-md transition-all hover:shadow-lg ${
                              d.status === 'returned'
                                ? 'border-amber-500 bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700'
                                : 'border-[#7A0010] bg-gradient-to-r from-[#7A0010] to-[#5A0010] text-white hover:from-[#8A0010] hover:to-[#6A0010]'
                            }`}
                          >
                            <span>{d.status === 'returned' ? 'Edit & Resubmit' : 'Edit'}</span>
                            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/load:translate-x-0.5" strokeWidth={2.5} />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {drafts.length > 0 && (
            <div>
              {dbDrafts.length > 0 && (
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Local Drafts
                </h3>
              )}
              <div className="grid gap-4">
                {drafts.map((d, index) => (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white via-gray-50/30 to-white p-6 shadow-sm transition-all duration-200 hover:border-[#7A0010]/30 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-shrink-0 mt-1 rounded-lg bg-gradient-to-br from-[#7A0010]/10 to-[#7A0010]/5 p-2.5">
                            <FileText className="h-5 w-5 text-[#7A0010]" strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-gray-900 mb-1.5 line-clamp-2">
                              {d.title}
                            </h3>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" strokeWidth={2} />
                                <span>{formatDate(d.updatedAt)}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
                                <span>Created {formatDate(d.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleLoad(d.id)}
                          className="group/load inline-flex items-center gap-2 rounded-xl border-2 border-[#7A0010] bg-gradient-to-r from-[#7A0010] to-[#5A0010] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:from-[#8A0010] hover:to-[#6A0010]"
                        >
                          <span>Load</span>
                          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/load:translate-x-0.5" strokeWidth={2.5} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDelete(d.id)}
                          className="inline-flex items-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-all hover:border-red-300 hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={2.5} />
                          <span>Delete</span>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {confirmUI}
    </div>
  );
}

export default function AdminDraftsPage() {
  return (
    <Suspense fallback={
      <div className="p-4 md:p-6 space-y-4 bg-neutral-50 min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#7A0010] mx-auto mb-2" />
          <p className="text-neutral-600">Loading drafts...</p>
        </div>
      </div>
    }>
      <AdminDraftsPageContent />
    </Suspense>
  );
}
