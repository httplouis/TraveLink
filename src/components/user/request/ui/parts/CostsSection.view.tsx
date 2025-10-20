"use client";

import * as React from "react";
import { TextInput, CurrencyInput, TextArea } from "@/components/user/request/ui/controls";
import { UI_TEXT } from "@/lib/user/request/uiText";
import { toNumOrNull } from "@/lib/common/number";

type OtherItem = { label: string; amount: number | null };

type Props = {
  costs: any;
  needsJustif: boolean;
  errors: Record<string, string>;
  onChangeCosts: (patch: any) => void;
};

export default function CostsSection({
  costs,
  needsJustif,
  errors,
  onChangeCosts,
}: Props) {
  // ----- Safe text fallbacks so we never pass `undefined` into string props
  const TXT = {
    title: UI_TEXT?.costs?.title ?? "Travel Cost (estimate)",
    food: UI_TEXT?.costs?.food ?? "Food",
    driversAllowance: UI_TEXT?.costs?.driversAllowance ?? "Driver’s allowance",
    rentVehicles: UI_TEXT?.costs?.rentVehicles ?? "Rent vehicles",
    hiredDrivers: UI_TEXT?.costs?.hiredDrivers ?? "Hired drivers",
    accommodation: UI_TEXT?.costs?.accommodation ?? "Accommodation",
    amountPh: UI_TEXT?.costs?.amountPh ?? "₱ 0.00",
    // new keys (local fallbacks only)
    otherGroup: "Other expenses",
    otherLabel: "Other (label)",
    otherLabelPh: "e.g., Materials, Printing",
    otherAmount: "Amount",
    justificationLabel: UI_TEXT?.justification?.label ?? "Justification",
    justificationPh: UI_TEXT?.justification?.placeholder ?? "Explain why these costs are needed…",
  };

  // Build working list from costs.otherItems or legacy pair
  const otherItems: OtherItem[] = React.useMemo(() => {
    if (Array.isArray(costs?.otherItems)) return costs.otherItems;
    const hasLegacy =
      (costs?.otherLabel && String(costs.otherLabel).trim().length > 0) ||
      (typeof costs?.otherAmount === "number" && !!costs.otherAmount);
    return hasLegacy
      ? [{ label: costs.otherLabel ?? "", amount: costs.otherAmount ?? null }]
      : [];
  }, [costs?.otherItems, costs?.otherLabel, costs?.otherAmount]);

  const setOtherItems = (next: OtherItem[]) => {
    onChangeCosts({
      otherItems: next,
      // clear legacy fields to avoid double counting anywhere else
      otherLabel: "",
      otherAmount: null,
    });
  };
  const addOther = () => setOtherItems([...otherItems, { label: "", amount: null }]);
  const updateOther = (i: number, patch: Partial<OtherItem>) =>
    setOtherItems(otherItems.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const removeOther = (i: number) => setOtherItems(otherItems.filter((_, idx) => idx !== i));

  return (
    <div className="mt-6 rounded-xl border border-neutral-200 p-4">
      <div className="mb-3 text-sm font-semibold">{TXT.title}</div>

      <div className="grid gap-4 md:grid-cols-2">
        <CurrencyInput
          label={TXT.food}
          placeholder={TXT.amountPh}
          value={costs?.food ?? ""}
          onChange={(e) => onChangeCosts({ food: toNumOrNull(e.target.value) })}
        />
        <CurrencyInput
          label={TXT.driversAllowance}
          placeholder={TXT.amountPh}
          value={costs?.driversAllowance ?? ""}
          onChange={(e) => onChangeCosts({ driversAllowance: toNumOrNull(e.target.value) })}
        />
        <CurrencyInput
          label={TXT.rentVehicles}
          placeholder={TXT.amountPh}
          value={costs?.rentVehicles ?? ""}
          onChange={(e) => onChangeCosts({ rentVehicles: toNumOrNull(e.target.value) })}
        />
        <CurrencyInput
          label={TXT.hiredDrivers}
          placeholder={TXT.amountPh}
          value={costs?.hiredDrivers ?? ""}
          onChange={(e) => onChangeCosts({ hiredDrivers: toNumOrNull(e.target.value) })}
        />
        <CurrencyInput
          label={TXT.accommodation}
          placeholder={TXT.amountPh}
          value={costs?.accommodation ?? ""}
          onChange={(e) => onChangeCosts({ accommodation: toNumOrNull(e.target.value) })}
        />

        {/* Dynamic Other expenses */}
        <div className="md:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium">{TXT.otherGroup}</div>
            <button
              type="button"
              onClick={addOther}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
            >
              + Add
            </button>
          </div>

          <div className="space-y-3">
            {otherItems.length === 0 && (
              <div className="text-xs text-neutral-500">No other expenses. Click “Add” to insert one.</div>
            )}

            {otherItems.map((row, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-3">
                <TextInput
                  label={idx === 0 ? TXT.otherLabel : ""}         
                  placeholder={TXT.otherLabelPh}
                  value={row.label}
                  onChange={(e) => updateOther(idx, { label: e.target.value })}
                  className="col-span-2"
                />
                <div className="flex items-end gap-2">
                  <CurrencyInput
                    label={idx === 0 ? TXT.otherAmount : ""}       
                    placeholder={TXT.amountPh}
                    value={row.amount ?? ""}
                    onChange={(e) => updateOther(idx, { amount: toNumOrNull(e.target.value) })}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeOther(idx)}
                    className="h-[38px] rounded-md border border-neutral-300 px-3 text-sm hover:bg-neutral-100"
                    aria-label="Remove"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {needsJustif && (
        <div className="mt-4">
          <TextArea
            id="to-justification"
            label={TXT.justificationLabel}
            required
            placeholder={TXT.justificationPh}
            value={costs?.justification ?? ""}
            onChange={(e) => onChangeCosts({ justification: e.target.value })}
            error={errors["travelOrder.costs.justification"]}
          />
        </div>
      )}
    </div>
  );
}
