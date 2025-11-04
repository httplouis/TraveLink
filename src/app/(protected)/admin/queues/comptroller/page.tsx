"use client";

import { useEffect, useState } from "react";

type Request = {
  id: string;
  created_by: string;
  current_status: string;
  form_payload: any;
  created_at: string;
};

export default function ComptrollerQueuePage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/requests/list?status=comptroller_pending")
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) setRequests(json.data || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-sm text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">
        Comptroller Queue
      </h1>
      <p className="text-sm text-slate-600">
        Requests pending comptroller approval
      </p>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No pending requests
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                  Requester
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                  Purpose
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm">{req.created_by || "N/A"}</td>
                  <td className="px-4 py-3 text-sm">
                    {req.form_payload?.purpose || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button className="text-[#7A0010] hover:underline">
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
