"use client";

import * as React from "react";
import { TextInput, CurrencyInput, TextArea } from "@/components/user/request/ui/controls";
import { UI_TEXT } from "@/lib/user/request/uiText";
import { toNumOrNull } from "@/lib/common/number";
import { AlertTriangle, Trash2, Plus } from "lucide-react";

type OtherItem = { label: string; amount: number | null };

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

  return (
    <div className="mt-6 rounded-xl border border-neutral-200 p-4">
      <div className="mb-3 text-sm font-semibold">{TXT.title}</div>

      <div className="grid gap-4 md:grid-cols-2">
        <CurrencyInput
          label={TXT.food}
          placeholder={TXT.amountPh}
          value={costs?.food ?? ""}
          onChange={(e) => {
            handleValidation(e.target.value, "Food", (validated) => {
              onChangeCosts({ food: validated });
            });
          }}
        />
        <CurrencyInput
          label={TXT.driversAllowance}
          placeholder={TXT.amountPh}
          value={costs?.driversAllowance ?? ""}
          onChange={(e) => {
            handleValidation(e.target.value, "Driver's Allowance", (validated) => {
              onChangeCosts({ driversAllowance: validated });
            });
          }}
        />
        <CurrencyInput
          label={TXT.rentVehicles}
          placeholder={TXT.amountPh}
          value={costs?.rentVehicles ?? ""}
          onChange={(e) => {
            handleValidation(e.target.value, "Rent Vehicles", (validated) => {
              onChangeCosts({ rentVehicles: validated });
            });
          }}
        />
        <CurrencyInput
          label={TXT.hiredDrivers}
          placeholder={TXT.amountPh}
          value={costs?.hiredDrivers ?? ""}
          onChange={(e) => {
            handleValidation(e.target.value, "Hired Drivers", (validated) => {
              onChangeCosts({ hiredDrivers: validated });
            });
          }}
        />
        <CurrencyInput
          label={TXT.accommodation}
          placeholder={TXT.amountPh}
          value={costs?.accommodation ?? ""}
          onChange={(e) => {
            handleValidation(e.target.value, "Accommodation", (validated) => {
              onChangeCosts({ accommodation: validated });
            });
          }}
        />

        {/* Dynamic Other expenses */}
        <div className="md:col-span-2">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-700">{TXT.otherGroup}</div>
              <button
                type="button"
                onClick={addOther}
                className="flex items-center gap-1.5 rounded-lg bg-[#7a0010] px-3 py-2 text-sm font-medium text-white hover:bg-[#5c000c] transition-colors"
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
                Add
              </button>
            </div>

            <div className="space-y-3">
              {otherItems.length === 0 && (
                <div className="text-center py-6 text-sm text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                  No other expenses yet. Click "Add" to insert one.
                </div>
              )}

              {otherItems.map((row, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                  <div className="grid grid-cols-3 gap-3">
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
                        onChange={(e) => {
                          handleValidation(e.target.value, row.label || "Other Expense", (validated) => {
                            updateOther(idx, { amount: validated });
                          });
                        }}
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeOther(idx)}
                        className="h-[38px] w-[38px] flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors border border-red-200"
                        aria-label="Remove"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </div>
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
