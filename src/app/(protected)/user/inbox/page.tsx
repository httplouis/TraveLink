"use client";

import * as React from "react";
import { Inbox, Search, FileText, Calendar, MapPin, CheckCircle } from "lucide-react";
import UserRequestModal from "@/components/user/UserRequestModal";
import { useToast } from "@/components/common/ui/Toast";

type Request = {
  id: string;
  request_number?: string;
  purpose?: string;
  destination?: string;
  travel_start_date?: string;
  travel_end_date?: string;
  requester_signature?: string;
  is_representative?: boolean;
  submitted_by_name?: string;
  expense_breakdown?: any[];
  total_budget?: number;
  created_at?: string;
};

export default function UserInboxPage() {
  const [requests, setRequests] = React.useState<Request[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedRequest, setSelectedRequest] = React.useState<Request | null>(null);
  const [showModal, setShowModal] = React.useState(false);
  const toast = useToast();

  React.useEffect(() => {
    document.title = "My Inbox - TraviLink";
  }, []);

  React.useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 10000); // Auto-refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/inbox", { cache: "no-store" });
      const data = await res.json();
      
      if (data.ok && Array.isArray(data.data)) {
        setRequests(data.data);
      } else {
        console.error("Failed to load requests:", data);
        toast({
          kind: "error",
          title: "Load failed",
          message: data.error || "Could not load requests.",
        });
      }
    } catch (err) {
      console.error("Failed to load requests:", err);
      toast({
        kind: "error",
        title: "Load failed",
        message: "Could not load requests.",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = React.useMemo(() => {
    const query = searchQuery.toLowerCase();
    return requests.filter(req => 
      req.request_number?.toLowerCase().includes(query) ||
      req.purpose?.toLowerCase().includes(query) ||
      req.destination?.toLowerCase().includes(query)
    );
  }, [requests, searchQuery]);

  const handleReviewClick = (req: Request) => {
    setSelectedRequest(req);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedRequest(null);
    loadRequests(); // Refresh list
  };

  const handleSigned = () => {
    loadRequests(); // Refresh list after signing
  };

  function formatDate(dateStr?: string | null) {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-PH", { 
        month: "short", 
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Inbox className="h-6 w-6 text-[#7A0010]" />
              My Inbox
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Requests pending your signature
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by request number, purpose, or destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#7A0010] focus:outline-none"
          />
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">
                {searchQuery ? "No requests match your search" : "No pending requests"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {searchQuery 
                  ? "Try a different search term" 
                  : "Requests submitted on your behalf will appear here"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleReviewClick(req)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-900">
                            {req.request_number || `Request ${req.id.slice(0, 8)}`}
                          </span>
                        </div>
                        {req.is_representative && req.submitted_by_name && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                            Submitted by {req.submitted_by_name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {req.purpose || "No purpose specified"}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{req.destination || "—"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {formatDate(req.travel_start_date)} - {formatDate(req.travel_end_date)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReviewClick(req);
                        }}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#7A0010] to-[#5A0010] text-white text-sm font-semibold hover:shadow-md transition-all flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Review & Sign
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedRequest && (
        <UserRequestModal
          request={selectedRequest}
          onClose={handleModalClose}
          onSigned={handleSigned}
        />
      )}
    </>
  );
}

