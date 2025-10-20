"use client";

import * as React from "react";
import { TextInput, CurrencyInput, TextArea } from "@/components/user/request/ui/controls";
import { UI_TEXT } from "@/lib/user/request/uiText";
import { toNumOrNull } from "@/lib/common/number";

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
  return (
    <div className="mt-6 rounded-xl border border-neutral-200 p-4">
      <div className="mb-3 text-sm font-semibold">{UI_TEXT.costs.title}</div>

      <div className="grid gap-4 md:grid-cols-2">
        <CurrencyInput
          label={UI_TEXT.costs.food}
          placeholder={UI_TEXT.costs.amountPh}
          value={costs.food ?? ""}
          onChange={(e) => onChangeCosts({ food: toNumOrNull(e.target.value) })}
        />
        <CurrencyInput
          label={UI_TEXT.costs.driversAllowance}
          placeholder={UI_TEXT.costs.amountPh}
          value={costs.driversAllowance ?? ""}
          onChange={(e) =>
            onChangeCosts({ driversAllowance: toNumOrNull(e.target.value) })
          }
        />
        <CurrencyInput
          label={UI_TEXT.costs.rentVehicles}
          placeholder={UI_TEXT.costs.amountPh}
          value={costs.rentVehicles ?? ""}
          onChange={(e) =>
            onChangeCosts({ rentVehicles: toNumOrNull(e.target.value) })
          }
        />
        <CurrencyInput
          label={UI_TEXT.costs.hiredDrivers}
          placeholder={UI_TEXT.costs.amountPh}
          value={costs.hiredDrivers ?? ""}
          onChange={(e) =>
            onChangeCosts({ hiredDrivers: toNumOrNull(e.target.value) })
          }
        />
        <CurrencyInput
          label={UI_TEXT.costs.accommodation}
          placeholder={UI_TEXT.costs.amountPh}
          value={costs.accommodation ?? ""}
          onChange={(e) =>
            onChangeCosts({ accommodation: toNumOrNull(e.target.value) })
          }
        />

        <div className="grid grid-cols-3 gap-3 md:col-span-2">
          <TextInput
            label={UI_TEXT.costs.otherLabel}
            placeholder={UI_TEXT.costs.otherLabelPh}
            value={costs.otherLabel ?? ""}
            onChange={(e) => onChangeCosts({ otherLabel: e.target.value })}
          />
          <CurrencyInput
            label={UI_TEXT.costs.otherAmount}
            placeholder={UI_TEXT.costs.amountPh}
            value={costs.otherAmount ?? ""}
            onChange={(e) =>
              onChangeCosts({ otherAmount: toNumOrNull(e.target.value) })
            }
            className="col-span-2 sm:col-span-1"
          />
        </div>
      </div>

      {needsJustif && (
        <div className="mt-4">
          <TextArea
            id="to-justification"
            label={UI_TEXT.justification.label}
            required
            placeholder={UI_TEXT.justification.placeholder}
            value={costs.justification ?? ""}
            onChange={(e) => onChangeCosts({ justification: e.target.value })}
            error={errors["travelOrder.costs.justification"]}
          />
        </div>
      )}
    </div>
  );
}
