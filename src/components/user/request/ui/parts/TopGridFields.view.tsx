"use client";

import * as React from "react";
import {
  TextInput,
  DateInput,
} from "@/components/user/request/ui/controls";
import LocationField from "@/components/user/request/ui/LocationField.ui";
import DepartmentSelect from "@/components/common/inputs/DepartmentSelect.ui";
import { UI_TEXT } from "@/lib/user/request/uiText";


type Props = {
  data: any;
  errors: Record<string, string>;
  onChange: (patch: any) => void;
  onDepartmentChange: (dept: string) => void;
};

export default function TopGridFields({
  data,
  errors,
  onChange,
  onDepartmentChange,
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <DateInput
        id="to-date"
        label={UI_TEXT.date.label}
        required
        value={data?.date || ""}
        onChange={(e) => onChange({ date: e.target.value })}
        error={errors["travelOrder.date"]}
        helper={UI_TEXT.date.helper}
      />

      <div className="flex flex-col">
        <TextInput
          id="to-requester"
          label={UI_TEXT.requester.label}
          required
          placeholder={UI_TEXT.requester.placeholder}
          value={data?.requestingPerson || ""}
          onChange={(e) => onChange({ requestingPerson: e.target.value })}
          error={errors["travelOrder.requestingPerson"]}
          helper=""
        />
        <div className="text-xs text-neutral-500 min-h-[1.25rem] leading-5 invisible">
          placeholder
        </div>
      </div>

      <div className="grid gap-1">
        <DepartmentSelect
          id="to-department"
          label={UI_TEXT.dept.label}
          value={data?.department || ""}
          required
          placeholder={UI_TEXT.dept.placeholder}
          onChange={onDepartmentChange}
        />
        {errors["travelOrder.department"] && (
          <span className="text-xs text-red-600">
            {errors["travelOrder.department"]}
          </span>
        )}
      </div>

      <div className="grid gap-1">
        <LocationField
          label={UI_TEXT.destination.label}
          inputId="to-destination"
          value={data?.destination || ""}
          geo={data?.destinationGeo || null}
          onChange={({ address, geo }) =>
            onChange({ destination: address, destinationGeo: geo ?? undefined })
          }
          placeholder={UI_TEXT.destination.placeholder}
        />
        {errors["travelOrder.destination"] && (
          <span className="text-xs text-red-600">
            {errors["travelOrder.destination"]}
          </span>
        )}
      </div>

      <DateInput
        id="to-departure"
        label={UI_TEXT.departure.label}
        required
        value={data?.departureDate || ""}
        onChange={(e) => onChange({ departureDate: e.target.value })}
        error={errors["travelOrder.departureDate"]}
      />

      <DateInput
        id="to-return"
        label={UI_TEXT.return.label}
        required
        value={data?.returnDate || ""}
        onChange={(e) => onChange({ returnDate: e.target.value })}
        error={errors["travelOrder.returnDate"]}
      />
    </div>
  );
}
