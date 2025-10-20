"use client";

import * as React from "react";
import { TextArea } from "@/components/user/request/ui/controls";
// replace: import { UI_TEXT } from "./uiText";
import { UI_TEXT } from "@/lib/user/request/uiText";


type Props = {
  value: string;
  error?: string;
  onChange: (v: string) => void;
};

export default function PurposeField({ value, error, onChange }: Props) {
  return (
    <div className="mt-4">
      <TextArea
        id="to-purpose"
        label={UI_TEXT.purpose.label}
        required
        placeholder={UI_TEXT.purpose.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={error}
      />
    </div>
  );
}
