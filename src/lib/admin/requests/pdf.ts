// src/lib/admin/requests/pdf.ts
"use client";

// Client-side PDF generator using jsPDF + autoTable
// Make sure these are installed:
//   pnpm add jspdf jspdf-autotable
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type { AdminRequest } from "@/lib/admin/requests/store";
import type { RequestFormData, OtherCostItem } from "@/lib/user/request/types";

type Input = AdminRequest | RequestFormData;

function isAdminRequest(x: Input): x is AdminRequest {
  return typeof (x as any)?.id === "string" && "status" in (x as any);
}

function n(v: unknown): string {
  // normalize numbers/strings/null/undefined for display
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "number") return `₱${v}`;
  return String(v);
}

function costsToRows(costs: any): Array<[string, string]> {
  if (!costs) return [];
  const rows: Array<[string, string]> = [];

  Object.entries(costs).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "" ) return;

    if (Array.isArray(value)) {
      // OtherCostItem[]
      (value as OtherCostItem[]).forEach((item) => {
        if (!item) return;
        rows.push([item.label ?? "Other", n(item.amount)]);
      });
    } else {
      rows.push([key, n(value)]);
    }
  });

  return rows;
}

export function buildRequestPDF(input: Input) {
  const doc = new jsPDF();

  const travel = (input as any).travelOrder as RequestFormData["travelOrder"] | undefined;
  const school = (input as any).schoolService as RequestFormData["schoolService"] | undefined;
  const seminar = (input as any).seminar as RequestFormData["seminar"] | undefined;

  const fileId = isAdminRequest(input) ? input.id : "REQUEST";
  const createdAt = isAdminRequest(input) ? input.createdAt : undefined;
  const status = isAdminRequest(input) ? input.status : undefined;

  // Title
  doc.setFontSize(16);
  doc.text("TraviLink — Request Details", 14, 18);

  // Meta
  doc.setFontSize(10);
  const meta: string[] = [];
  if (isAdminRequest(input)) {
    meta.push(`ID: ${fileId}`);
    meta.push(`Status: ${status}`);
    if (createdAt) meta.push(`Created: ${new Date(createdAt).toLocaleString()}`);
  }
  if (meta.length) doc.text(meta.join("   •   "), 14, 24);

  let y = 30;

  // Travel Order
  if (travel) {
    autoTable(doc, {
      startY: y,
      head: [["Travel Order", ""]],
      body: [
        ["Date", n(travel.date)],
        ["Requesting Person", n(travel.requestingPerson)],
        ["Department", n(travel.department)],
        ["Destination", n(travel.destination)],
        ["Departure Date", n(travel.departureDate)],
        ["Return Date", n(travel.returnDate)],
        ["Purpose of Travel", n(travel.purposeOfTravel)],
      ],
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [122, 0, 16] }, // maroon
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    if (travel.costs) {
      autoTable(doc, {
        startY: y,
        head: [["Estimated Costs", "Amount"]],
        body: costsToRows(travel.costs),
        theme: "grid",
        styles: { fontSize: 10 },
      });
      y = (doc as any).lastAutoTable.finalY + 6;

      if ((travel.costs as any)?.justification) {
        autoTable(doc, {
          startY: y,
          head: [["Justification"]],
          body: [[String((travel.costs as any).justification)]],
          theme: "grid",
          styles: { fontSize: 10 },
        });
        y = (doc as any).lastAutoTable.finalY + 6;
      }
    }
  }

  // School Service
  if (school) {
    autoTable(doc, {
      startY: y,
      head: [["School Service", ""]],
      body: [
        ["Driver", n(school.driver)],
        ["Vehicle", n(school.vehicle)],
        ["Dispatcher Signed", school.vehicleDispatcherSigned ? "Yes" : "No"],
        ["Dispatcher Date", n(school.vehicleDispatcherDate)],
      ],
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [122, 0, 16] },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Seminar
  if (seminar) {
    autoTable(doc, {
      startY: y,
      head: [["Seminar Application", ""]],
      body: [
        ["Application Date", n(seminar.applicationDate)],
        ["Title", n(seminar.title)],
        ["Category", n(seminar.trainingCategory)],
        ["Date From", n(seminar.dateFrom)],
        ["Date To", n(seminar.dateTo)],
        ["Venue", n(seminar.venue)],
        ["Modality", n(seminar.modality)],
        ["Sponsor", n(seminar.sponsor)],
      ],
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [122, 0, 16] },
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    if (seminar.fees || seminar.breakdown) {
      const feeRows: Array<[string, string]> = [];
      if (seminar.fees?.registrationFee != null)
        feeRows.push(["Registration Fee", n(seminar.fees.registrationFee)]);
      if (seminar.fees?.totalAmount != null)
        feeRows.push(["Total Amount", n(seminar.fees.totalAmount)]);

      const br = seminar.breakdown;
      if (br) {
        if (br.registration != null) feeRows.push(["Registration", n(br.registration)]);
        if (br.accommodation != null) feeRows.push(["Accommodation", n(br.accommodation)]);
        if (br.perDiemMealsDriversAllowance != null)
          feeRows.push(["Per diem / Meals / Drivers allowance", n(br.perDiemMealsDriversAllowance)]);
        if (br.transportFareGasParkingToll != null)
          feeRows.push(["Transport / Gas / Parking / Toll", n(br.transportFareGasParkingToll)]);
        if (Array.isArray(br.otherItems)) {
          br.otherItems.forEach((it) => feeRows.push([it.label ?? "Other", n(it.amount)]));
        }
        if (br.otherLabel || br.otherAmount != null) {
          feeRows.push([br.otherLabel ?? "Other", n(br.otherAmount)]);
        }
      }

      if (feeRows.length) {
        autoTable(doc, {
          startY: y,
          head: [["Fees & Breakdown", "Amount"]],
          body: feeRows,
          theme: "grid",
          styles: { fontSize: 10 },
        });
        y = (doc as any).lastAutoTable.finalY + 6;
      }
    }

    if (Array.isArray(seminar.applicants) && seminar.applicants.length) {
      autoTable(doc, {
        startY: y,
        head: [["Applicants", "Department/Office", "Available FDP", "Signed?"]],
        body: seminar.applicants.map((a) => [
          n(a.name),
          n(a.departmentOffice),
          n(a.availableFDP),
          a.signature ? "Yes" : "No",
        ]),
        theme: "grid",
        styles: { fontSize: 10 },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }
  }

  doc.save(`${fileId}.pdf`);
}
