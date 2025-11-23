"use client";

import * as React from "react";
import { TextInput, CurrencyInput, TextArea } from "@/components/user/request/ui/controls";
import { UI_TEXT } from "@/lib/user/request/uiText";
import { toNumOrNull } from "@/lib/common/number";
import { AlertTriangle, Trash2, Plus } from "lucide-react";

type OtherItem = { label: string; amount: number | null; description?: string };

type Props = {
  costs: any;
  needsJustif: boolean;
  errors: Record<string, string>;
  onChangeCosts: (patch: any) => void;
};

type ConfirmModalProps = {
  amount: string;
  fieldName: string;
  onConfirm: () => void;
  onCancel: () => void;
};

function LargeAmountModal({ amount, fieldName, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="bg-[#7a0010] px-6 py-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-white" strokeWidth={2} />
          <h3 className="text-lg font-semibold text-white">Large Amount Detected</h3>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-gray-700 text-sm">
            You entered <span className="font-bold text-gray-900">{amount}</span> for <span className="font-semibold text-gray-900">{fieldName}</span>.
          </p>
          <p className="text-gray-600 text-sm">
            This is a very large amount. Please verify that this is correct before proceeding.
          </p>
        </div>
        <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg font-medium text-white bg-[#7a0010] hover:bg-[#5c000c] transition-colors"
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
}

// Maximum reasonable budget amount (50k pesos)
const MAX_REASONABLE_AMOUNT = 50_000;

export default function CostsSection({
  costs,
  needsJustif,
  errors,
  onChangeCosts,
}: Props) {
  // Modal state for large amount confirmation
  const [showModal, setShowModal] = React.useState(false);
  const [pendingValidation, setPendingValidation] = React.useState<{
    value: number;
    fieldName: string;
    formattedAmount: string;
    callback: (value: number | null) => void;
  } | null>(null);

  // Handle validation with modal
  const handleValidation = (value: string, fieldName: string, callback: (value: number | null) => void) => {
    const num = toNumOrNull(value);
    
    if (num === null) {
      callback(null);
      return;
    }
    
    if (num < 0) {
      alert(`${fieldName} cannot be negative. Please enter a valid amount.`);
      callback(null);
      return;
    }
    
    if (num > MAX_REASONABLE_AMOUNT) {
      const formatted = new Intl.NumberFormat('en-PH', { 
        style: 'currency', 
        currency: 'PHP' 
      }).format(num);
      
      setPendingValidation({ value: num, fieldName, formattedAmount: formatted, callback });
      setShowModal(true);
    } else {
      callback(num);
    }
  };

  const handleModalConfirm = () => {
    if (pendingValidation) {
      pendingValidation.callback(pendingValidation.value);
    }
    setShowModal(false);
    setPendingValidation(null);
  };

  const handleModalCancel = () => {
    if (pendingValidation) {
      pendingValidation.callback(null);
    }
    setShowModal(false);
    setPendingValidation(null);
  };

  // ----- Safe text fallbacks so we never pass `undefined` into string props
  const TXT = {
    title: UI_TEXT?.costs?.title ?? "Travel Cost (estimate)",
    food: UI_TEXT?.costs?.food ?? "Food",
    driversAllowance: UI_TEXT?.costs?.driversAllowance ?? "Driver's allowance",
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

  // Calculate total
  const totalCost = React.useMemo(() => {
    const base = (costs?.food || 0) + 
                 (costs?.driversAllowance || 0) + 
                 (costs?.rentVehicles || 0) + 
                 (costs?.hiredDrivers || 0) + 
                 (costs?.accommodation || 0);
    const otherTotal = otherItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    return base + otherTotal;
  }, [costs, otherItems]);

  return (
    <div className="mt-8 rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white via-gray-50/30 to-white p-6 shadow-lg">
      <div className="mb-5 flex items-center justify-between border-b-2 border-gray-200 pb-4">
        <div>
          <h4 className="text-lg font-bold text-gray-900 tracking-tight">{TXT.title}</h4>
          <p className="mt-1 text-xs text-gray-600">Estimate your travel expenses</p>
        </div>
        {totalCost > 0 && (
          <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 px-5 py-2.5 shadow-sm">
            <span className="text-sm font-bold text-blue-800">
              Total: ₱{totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Food */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">{TXT.food}</label>
          <CurrencyInput
            label=""
            placeholder={TXT.amountPh}
            value={costs?.food ?? 500}
            onChange={(e) => {
              handleValidation(e.target.value, "Food", (validated) => {
                onChangeCosts({ food: validated });
              });
            }}
          />
          <TextInput
            label=""
            placeholder="e.g., Lunch during seminar, Meals for 2 days"
            value={costs?.foodDescription ?? ""}
            onChange={(e) => onChangeCosts({ foodDescription: e.target.value })}
          />
        </div>

        {/* Driver's Allowance */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">{TXT.driversAllowance}</label>
          <CurrencyInput
            label=""
            placeholder={TXT.amountPh}
            value={costs?.driversAllowance ?? 0}
            onChange={(e) => {
              handleValidation(e.target.value, "Driver's Allowance", (validated) => {
                onChangeCosts({ driversAllowance: validated });
              });
            }}
          />
          <TextInput
            label=""
            placeholder="e.g., Daily allowance for driver"
            value={costs?.driversAllowanceDescription ?? ""}
            onChange={(e) => onChangeCosts({ driversAllowanceDescription: e.target.value })}
          />
        </div>

        {/* Rent Vehicles */}
        <div className="space-y-2">
          <CurrencyInput
            label={TXT.rentVehicles}
            placeholder={TXT.amountPh}
            value={costs?.rentVehicles ?? 0}
            onChange={(e) => {
              handleValidation(e.target.value, "Rent Vehicles", (validated) => {
                onChangeCosts({ rentVehicles: validated });
              });
            }}
          />
          <TextInput
            label=""
            placeholder="e.g., Van rental for 3 days"
            value={costs?.rentVehiclesDescription ?? ""}
            onChange={(e) => onChangeCosts({ rentVehiclesDescription: e.target.value })}
          />
        </div>

        {/* Hired Drivers */}
        <div className="space-y-2">
          <CurrencyInput
            label={TXT.hiredDrivers}
            placeholder={TXT.amountPh}
            value={costs?.hiredDrivers ?? 0}
            onChange={(e) => {
              handleValidation(e.target.value, "Hired Drivers", (validated) => {
                onChangeCosts({ hiredDrivers: validated });
              });
            }}
          />
          <TextInput
            label=""
            placeholder="e.g., Hired driver for long-distance travel"
            value={costs?.hiredDriversDescription ?? ""}
            onChange={(e) => onChangeCosts({ hiredDriversDescription: e.target.value })}
          />
        </div>

        {/* Accommodation */}
        <div className="space-y-2">
          <CurrencyInput
            label={TXT.accommodation}
            placeholder={TXT.amountPh}
            value={costs?.accommodation ?? 0}
            onChange={(e) => {
              handleValidation(e.target.value, "Accommodation", (validated) => {
                onChangeCosts({ accommodation: validated });
              });
            }}
          />
          <TextInput
            label=""
            placeholder="e.g., Hotel for 2 nights, Lodging expenses"
            value={costs?.accommodationDescription ?? ""}
            onChange={(e) => onChangeCosts({ accommodationDescription: e.target.value })}
          />
        </div>

        {/* Dynamic Other expenses - Enhanced */}
        <div className="md:col-span-2">
          <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h5 className="text-sm font-bold text-gray-900">{TXT.otherGroup}</h5>
              <button
                type="button"
                onClick={addOther}
                className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#7A0010] to-[#5A0010] px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:from-[#8A0010] hover:to-[#6A0010] hover:shadow-lg active:scale-[0.98]"
              >
                <Plus className="h-4 w-4 text-white" strokeWidth={2.5} />
                <span className="text-white">Add Expense</span>
              </button>
            </div>

            <div className="space-y-3">
              {otherItems.length === 0 && (
                <div className="text-center py-8 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                  <p className="text-sm font-medium text-gray-500">No other expenses added yet</p>
                  <p className="mt-1 text-xs text-gray-400">Click "Add Expense" to add additional cost items</p>
                </div>
              )}

              {otherItems.map((row, idx) => (
                <div key={idx} className="rounded-lg border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm transition-all hover:border-gray-300">
                  <div className="space-y-3">
                    <div className="grid grid-cols-[1fr_180px_50px] gap-3 items-end">
                      <TextInput
                        label={idx === 0 ? TXT.otherLabel : ""}         
                        placeholder={TXT.otherLabelPh}
                        value={row.label}
                        onChange={(e) => updateOther(idx, { label: e.target.value })}
                      />
                      <CurrencyInput
                        label={idx === 0 ? TXT.otherAmount : ""}       
                        placeholder={TXT.amountPh}
                        value={row.amount ?? ""}
                        onChange={(e) => {
                          handleValidation(e.target.value, row.label || "Other Expense", (validated) => {
                            updateOther(idx, { amount: validated });
                          });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeOther(idx)}
                        className="mb-0.5 flex h-10 w-10 items-center justify-center rounded-lg border-2 border-red-200 bg-red-50 text-red-600 transition-all hover:border-red-300 hover:bg-red-100"
                        aria-label="Remove"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2.5} />
                      </button>
                    </div>
                    <TextInput
                      label=""
                      placeholder="e.g., Details or justification for this expense"
                      value={row.description ?? ""}
                      onChange={(e) => updateOther(idx, { description: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {needsJustif && (
        <div className="mt-4">
          <TextArea
            id="to-justification"
            label={TXT.justificationLabel}
            placeholder={TXT.justificationPh}
            value={costs?.justification ?? ""}
            onChange={(e) => onChangeCosts({ justification: e.target.value })}
            error={errors["travelOrder.costs.justification"]}
          />
        </div>
      )}

      {/* Modal */}
      {showModal && pendingValidation && (
        <LargeAmountModal
          amount={pendingValidation.formattedAmount}
          fieldName={pendingValidation.fieldName}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
        />
      )}
    </div>
  );
}
