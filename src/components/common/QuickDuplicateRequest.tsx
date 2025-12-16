"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, X, Clock, MapPin, Calendar, ChevronRight, Search, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface PreviousRequest {
  id: string;
  request_number?: string;
  purpose: string;
  destination: string;
  departure_date: string;
  return_date: string;
  status: string;
  created_at: string;
}

interface QuickDuplicateRequestProps {
  onDuplicate?: (requestId: string) => void;
  basePath?: string;
}

export default function QuickDuplicateRequest({ onDuplicate, basePath = "/user" }: QuickDuplicateRequestProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [requests, setRequests] = useState<PreviousRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (showModal) {
      loadPreviousRequests();
    }
  }, [showModal]);

  const loadPreviousRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/requests?limit=20&status=completed,approved,assigned", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setRequests(data.data || []);
        }
      }
    } catch (error) {
      console.error("Failed to load requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (request: PreviousRequest) => {
    setDuplicating(request.id);
    try {
      // Create a new draft based on the selected request
      const res = await fetch(`/api/requests/${request.id}/duplicate`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.data?.id) {
          setShowModal(false);
          if (onDuplicate) {
            onDuplicate(data.data.id);
          } else {
            router.push(`${basePath}/request?draft=${data.data.id}`);
          }
        }
      }
    } catch (error) {
      console.error("Failed to duplicate request:", error);
    } finally {
      setDuplicating(null);
    }
  };

  const filteredRequests = requests.filter(
    (r) =>
      r.purpose?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.request_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all"
      >
        <Copy className="h-4 w-4" />
        <span className="text-sm font-medium">Duplicate Previous</span>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Copy className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Duplicate Request</h3>
                      <p className="text-white/70 text-sm">Select a previous request to copy</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by purpose, destination..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Request List */}
              <div className="max-h-96 overflow-y-auto p-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Copy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No previous requests found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredRequests.map((request, index) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => handleDuplicate(request)}
                        className={`p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 cursor-pointer transition-all ${
                          duplicating === request.id ? "opacity-50 pointer-events-none" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900 truncate">
                                {request.request_number || request.id.slice(0, 8)}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                                {request.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate mb-2">{request.purpose}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {request.destination}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(request.departure_date)}
                              </span>
                            </div>
                          </div>
                          {duplicating === request.id ? (
                            <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
