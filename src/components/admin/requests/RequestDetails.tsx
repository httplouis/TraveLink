"use client";

import * as React from "react";
import { fetchRequest } from "@/lib/admin/requests/api";
import { buildRequestPDF } from "@/lib/admin/requests/pdf";
import type { AdminRequest } from "@/lib/admin/requests/store";

export default function RequestDetails({ id }: { id: string }) {
  const [data, setData] = React.useState<AdminRequest | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadRequest() {
      try {
        setLoading(true);
        setError(null);
        const request = await fetchRequest(id);
        setData(request);
      } catch (err: any) {
        console.error("[RequestDetails] Error loading request:", err);
        setError(err.message || "Failed to load request");
      } finally {
        setLoading(false);
      }
    }
    
    if (id) {
      loadRequest();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 text-sm text-neutral-500">
        Loading request details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-red-600">
        Error: {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-sm text-neutral-500">
        Request not found.
      </div>
    );
  }

  function handleDownload() {
    try {
      buildRequestPDF(data!); // ✅ non-null assertion since above guard ensures data exists
    } catch (err: any) {
      alert(err?.message || "Failed to generate PDF");
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Request Details</h2>
        <button
          onClick={handleDownload}
          className="rounded bg-[#7A0010] px-4 py-2 text-white"
        >
          Download PDF
        </button>
      </div>

      {/* Top-level meta */}
      <section className="space-y-1">
        <div><strong>ID:</strong> {data.id}</div>
        <div><strong>Status:</strong> {data.status}</div>
        <div><strong>Created At:</strong> {data.createdAt}</div>
        <div><strong>Reason:</strong> {data.reason}</div>
        <div><strong>Vehicle Mode:</strong> {data.vehicleMode}</div>
        <div><strong>Requester Role:</strong> {data.requesterRole}</div>
      </section>

      {/* Travel Order */}
      {data.travelOrder && (
        <section className="space-y-1 border-t pt-4">
          <h3 className="font-medium">Travel Order</h3>
          <div><strong>Date:</strong> {data.travelOrder.date}</div>
          <div><strong>Requesting Person:</strong> {data.travelOrder.requestingPerson}</div>
          <div><strong>Department:</strong> {data.travelOrder.department}</div>
          <div><strong>Destination:</strong> {data.travelOrder.destination}</div>
          <div>
            <strong>Departure:</strong> {data.travelOrder.departureDate} •{" "}
            <strong>Return:</strong> {data.travelOrder.returnDate}
          </div>
          <div><strong>Purpose:</strong> {data.travelOrder.purposeOfTravel}</div>
          <div>
            <strong>Costs:</strong>{" "}
            {data.travelOrder.costs && JSON.stringify(data.travelOrder.costs)}
          </div>
          {data.travelOrder.endorsedByHeadName && (
            <div>
              <strong>Endorsed By:</strong>{" "}
              {data.travelOrder.endorsedByHeadName} (
              {data.travelOrder.endorsedByHeadDate})
            </div>
          )}
        </section>
      )}

      {/* School Service */}
      {data.schoolService && (
        <section className="space-y-1 border-t pt-4">
          <h3 className="font-medium">School Service</h3>
          <div><strong>Driver:</strong> {data.schoolService.driver}</div>
          <div><strong>Vehicle:</strong> {data.schoolService.vehicle}</div>
          <div>
            <strong>Dispatcher Signed:</strong>{" "}
            {data.schoolService.vehicleDispatcherSigned ? "Yes" : "No"}
          </div>
          <div>
            <strong>Date:</strong> {data.schoolService.vehicleDispatcherDate}
          </div>
        </section>
      )}

      {/* Seminar Application */}
      {data.seminar && (
        <section className="space-y-1 border-t pt-4">
          <h3 className="font-medium">Seminar Application</h3>
          <div><strong>Title:</strong> {data.seminar.title}</div>
          <div><strong>Application Date:</strong> {data.seminar.applicationDate}</div>
          <div>
            <strong>Dates:</strong> {data.seminar.dateFrom} → {data.seminar.dateTo}
          </div>
          <div><strong>Category:</strong> {data.seminar.trainingCategory}</div>
          <div><strong>Sponsor:</strong> {data.seminar.sponsor}</div>
          <div><strong>Venue:</strong> {data.seminar.venue}</div>
          {data.seminar.breakdown && (
            <div>
              <strong>Breakdown:</strong> {JSON.stringify(data.seminar.breakdown)}
            </div>
          )}
          {data.seminar.applicants && data.seminar.applicants.length > 0 && (
            <div>
              <strong>Applicants:</strong>{" "}
              {data.seminar.applicants.map((a) => a.name).join(", ")}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
