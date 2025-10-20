"use client";

import * as React from "react";
import { TextInput, DateInput } from "@/components/user/request/ui/controls";
// replace: import { UI_TEXT } from "./uiText";
import { UI_TEXT } from "@/lib/user/request/uiText";


type Props = {
  nameValue: string;
  dateValue: string;
  onNameChange: (v: string) => void;
  onDateChange: (v: string) => void;
};

export default function EndorsementSection({
  nameValue,
  dateValue,
  onNameChange,
  onDateChange,
}: Props) {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <TextInput
        label={UI_TEXT.endorsedBy.name}
        placeholder={UI_TEXT.endorsedBy.namePh}
        value={nameValue}
        onChange={(e) => onNameChange(e.target.value)}
      />
      <DateInput
        label={UI_TEXT.endorsedBy.date}
        value={dateValue}
        onChange={(e) => onDateChange(e.target.value)}
      />
    </div>
  );
}
