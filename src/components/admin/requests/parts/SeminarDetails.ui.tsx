// src/components/admin/requests/parts/SeminarDetails.ui.tsx
"use client";

import * as React from "react";
import type { AdminRequest } from "@/lib/admin/requests/store";

/** Peso formatter */
function peso(n: number | null | undefined) {
  if (typeof n !== "number" || !isFinite(n)) return "₱0.00";
  return `₱${n.toLocaleString("en-PH", { maximumFractionDigits: 2 })}`;
}

/** Derive the Seminar type from AdminRequest so we stay in sync */
type Seminar = NonNullable<AdminRequest["seminar"]>;

/** Training category label map (exclude the empty string from the key union) */
type Category = Exclude<NonNullable<Seminar["trainingCategory"]>, "">;
const CAT_LABEL: Record<Category, string> = {
  local: "local",
  regional: "regional",
  national: "national",
  international: "international",
};

/** Narrow possibly-empty category to a proper union or null */
function toCategory(v: Seminar["trainingCategory"]): Category | null {
  return v ? (v as Category) : null;
}

export default function SeminarDetails({
  seminar,
}: {
  seminar?: AdminRequest["seminar"];
}) {
  if (!seminar) return null;

  const cat = toCategory(seminar.trainingCategory);

  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-neutral-700">
        Seminar Application
      </h3>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <dt className="font-semibold">Application Date</dt>
        <dd>{seminar.applicationDate || "—"}</dd>

        <dt className="font-semibold">Title</dt>
        <dd>{seminar.title || "—"}</dd>

        <dt className="font-semibold">Category</dt>
        <dd>{cat ? CAT_LABEL[cat] : "—"}</dd>

        <dt className="font-semibold">Date From</dt>
        <dd>{seminar.dateFrom || "—"}</dd>

        <dt className="font-semibold">Date To</dt>
        <dd>{seminar.dateTo || "—"}</dd>

        <dt className="font-semibold">Venue</dt>
        <dd>{seminar.venue || "—"}</dd>

        <dt className="font-semibold">Modality</dt>
        <dd>{seminar.modality || "—"}</dd>

        {"fees" in seminar && (
          <>
            <dt className="font-semibold">Registration cost</dt>
            <dd>{peso((seminar as any).fees?.registrationFee ?? null)}</dd>

            <dt className="font-semibold">Total amount of expenses</dt>
            <dd>{peso((seminar as any).fees?.totalAmount ?? null)}</dd>
          </>
        )}
      </dl>

      {/* Optional breakdown (if present in your data) */}
      {"breakdown" in seminar && seminar.breakdown ? (
        <div className="mt-3">
          <h4 className="mb-1 text-sm font-semibold text-neutral-700">
            Breakdown of Expenses
          </h4>
          <table className="w-full text-sm border border-neutral-200 rounded">
            <tbody>
              {"registration" in seminar.breakdown && (
                <tr>
                  <td className="px-2 py-1">Registration</td>
                  <td className="px-2 py-1 text-right">
                    {peso((seminar.breakdown as any).registration ?? null)}
                  </td>
                </tr>
              )}
              {"accommodation" in seminar.breakdown && (
                <tr>
                  <td className="px-2 py-1">Accommodation</td>
                  <td className="px-2 py-1 text-right">
                    {peso((seminar.breakdown as any).accommodation ?? null)}
                  </td>
                </tr>
              )}
              {"perDiemMealsDriversAllowance" in seminar.breakdown && (
                <tr>
                  <td className="px-2 py-1">Per diem / Meals / Driver’s allowance</td>
                  <td className="px-2 py-1 text-right">
                    {peso(
                      (seminar.breakdown as any).perDiemMealsDriversAllowance ??
                        null
                    )}
                  </td>
                </tr>
              )}
              {"transportFareGasParkingToll" in seminar.breakdown && (
                <tr>
                  <td className="px-2 py-1">Transport / Fare / Gas / Parking / Toll</td>
                  <td className="px-2 py-1 text-right">
                    {peso(
                      (seminar.breakdown as any).transportFareGasParkingToll ??
                        null
                    )}
                  </td>
                </tr>
              )}
              {"otherLabel" in seminar.breakdown &&
                "otherAmount" in seminar.breakdown &&
                (seminar.breakdown as any).otherLabel && (
                  <tr>
                    <td className="px-2 py-1">
                      {(seminar.breakdown as any).otherLabel}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {peso((seminar.breakdown as any).otherAmount ?? null)}
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Optional undertaking & fund line if you want to show them */}
      {"applicantUndertaking" in seminar && (
        <p className="mt-2 text-sm">
          Applicant’s Undertaking:{" "}
          {(seminar as any).applicantUndertaking ? "Agreed" : "—"}
        </p>
      )}
      {"fundReleaseLine" in seminar && (
        <p className="text-sm">
          Fund release line: {peso((seminar as any).fundReleaseLine ?? null)}
        </p>
      )}
    </section>
  );
}
