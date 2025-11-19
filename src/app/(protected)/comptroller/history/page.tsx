// src/app/(protected)/comptroller/history/page.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Search, Filter, CheckCircle, XCircle, Calendar, Download } from "lucide-react";

type Decision = {
  id: string;
  request_number: string;
  requester: string;
  department: string;
  budget: number;
  edited_budget?: number;
  decision: "approved" | "rejected";
  decision_date: string;
  notes: string;
};

export default function ComptrollerHistory() {
  const [decisions, setDecisions] = React.useState<Decision[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterDecision, setFilterDecision] = React.useState<"all" | "approved" | "rejected">("all");
  const [loading, setLoading] = React.useState(true);

  // Set page title
  React.useEffect(() => {
    document.title = "Comptroller History - Travelink";
  }, []);

  React.useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await fetch("/api/comptroller/history");
      if (res.ok) {
        const data = await res.json();
        setDecisions(data);
      }
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDecisions = React.useMemo(() => {
    let result = decisions;

    // Filter by status
    if (filterDecision !== "all") {
      result = result.filter(d => d.decision === filterDecision);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.request_number.toLowerCase().includes(query) ||
        d.requester.toLowerCase().includes(query) ||
        d.department.toLowerCase().includes(query)
      );
    }

    return result;
  }, [decisions, filterDecision, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-[#7A0010] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Decision History</h1>
          <p className="text-gray-600 mt-2">View all past budget decisions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#7A0010] text-white rounded-lg hover:bg-[#5A0010] transition-colors">
          <Download className="h-5 w-5" />
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by request number, requester, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterDecision("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterDecision === "all"
                ? "bg-[#7A0010] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterDecision("approved")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterDecision === "approved"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilterDecision("rejected")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterDecision === "rejected"
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {filteredDecisions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No decisions found matching your criteria
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredDecisions.map((decision, index) => (
              <motion.div
                key={decision.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-gray-900">{decision.request_number}</span>
                      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                        decision.decision === "approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {decision.decision === "approved" ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        {decision.decision === "approved" ? "Approved" : "Rejected"}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-1 mb-3">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Requester:</span> {decision.requester}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Department:</span> {decision.department}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {new Date(decision.decision_date).toLocaleString()}
                      </div>
                    </div>

                    {/* Notes */}
                    {decision.notes && (
                      <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="text-sm text-gray-700">
                          <span className="font-semibold">Notes:</span> {decision.notes}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Budget */}
                  <div className="text-right ml-6">
                    <div className="text-xs text-gray-500 mb-1">Original Budget</div>
                    {decision.edited_budget && decision.edited_budget !== decision.budget ? (
                      <>
                        <div className="text-sm text-gray-400 line-through">
                          ₱{decision.budget.toLocaleString()}
                        </div>
                        <div className="text-lg font-bold text-[#7A0010]">
                          ₱{decision.edited_budget.toLocaleString()}
                        </div>
                        <div className="text-xs text-green-600 font-medium mt-1">
                          Saved ₱{(decision.budget - decision.edited_budget).toLocaleString()}
                        </div>
                      </>
                    ) : (
                      <div className="text-lg font-bold text-gray-900">
                        ₱{decision.budget.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
