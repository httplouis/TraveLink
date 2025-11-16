"use client";

import * as React from "react";
import type { VehicleMode } from "@/lib/user/request/types";
// Removed getDepartmentHead import - we always fetch from database now
import TravelOrderFormView from "./TravelOrderForm.view";

type Props = {
  data: any;
  onChange: (patch: any) => void;
  onChangeCosts: (patch: any) => void;
  errors: Record<string, string>;
  vehicleMode: VehicleMode;
  isHeadRequester?: boolean;
  isRepresentativeSubmission?: boolean;
  requestingPersonHeadName?: string;
  currentUserName?: string;
};

export default function TravelOrderForm({
  data,
  onChange,
  onChangeCosts,
  errors,
  vehicleMode,
  isHeadRequester,
  isRepresentativeSubmission,
  requestingPersonHeadName,
  currentUserName,
}: Props) {
  // Always show justification field (but it's optional)
  const needsJustif = true;

  const headEditedRef = React.useRef(false);

  async function handleDepartmentChange(nextDept: string) {
    const patch: any = { department: nextDept };

    const currentHead = data?.endorsedByHeadName ?? "";
    if (!headEditedRef.current || !currentHead) {
      // Try to fetch department head from database first
      try {
        // Extract department code from format "Name (CODE)" or use full name
        const deptCodeMatch = nextDept.match(/\(([^)]+)\)$/);
        const deptCode = deptCodeMatch ? deptCodeMatch[1] : null;
        const deptName = nextDept.replace(/\s*\([^)]*\)\s*$/, '').trim();
        
        // First, get department ID
        let deptId = null;
        let dept: any = null;
        
        if (deptCode) {
          const deptResponse = await fetch(`/api/departments?code=${encodeURIComponent(deptCode)}`);
          const deptData = await deptResponse.json();
          if (deptData.ok && deptData.departments?.[0]) {
            dept = deptData.departments[0];
            deptId = dept.id;
          }
        }
        
        // If not found by code, try by name
        if (!deptId && deptName) {
          const deptResponse = await fetch(`/api/departments?name=${encodeURIComponent(deptName)}`);
          const deptData = await deptResponse.json();
          if (deptData.ok && deptData.departments?.[0]) {
            dept = deptData.departments[0];
            deptId = dept.id;
          }
        }
        
        // If still not found and nextDept looks like a code (e.g., "CCMS"), try direct code lookup
        if (!deptId && nextDept.length <= 10 && nextDept === nextDept.toUpperCase()) {
          const deptResponse = await fetch(`/api/departments?code=${encodeURIComponent(nextDept)}`);
          const deptData = await deptResponse.json();
          if (deptData.ok && deptData.departments?.[0]) {
            dept = deptData.departments[0];
            deptId = dept.id;
            // Also update the department field to full format
            const deptFormatted = dept.code 
              ? `${dept.name} (${dept.code})`
              : dept.name;
            patch.department = deptFormatted;
          }
        }
        
        // Fetch department head from database
        if (deptId) {
          console.log('[TravelOrderForm] 🔍 Fetching head for department_id:', deptId);
          const headResponse = await fetch(`/api/approvers?role=head&department_id=${deptId}`);
          const headData = await headResponse.json();
          if (headData.ok && headData.data && headData.data.length > 0) {
            const head = headData.data[0];
            const headName = head.name || "";
            console.log('[TravelOrderForm] ✅ Found department head:', headName);
            patch.endorsedByHeadName = headName;
          } else {
            console.warn('[TravelOrderForm] ⚠️ No department head found in database for department_id:', deptId);
            // Don't use hardcoded fallback - leave empty or use generic
            patch.endorsedByHeadName = "";
          }
        } else {
          console.warn('[TravelOrderForm] ⚠️ Department not found in database:', nextDept);
          // Don't use hardcoded fallback - leave empty
          patch.endorsedByHeadName = "";
        }
      } catch (error) {
        console.error('[TravelOrderForm] ❌ Failed to fetch department head from database:', error);
        // Don't use hardcoded fallback - leave empty
        patch.endorsedByHeadName = "";
      }
    }

    onChange(patch);
  }

  // Submission is now handled by SubmitBar component in RequestWizard
  // This form should only handle data input, not submission

  return (
    <TravelOrderFormView
      data={data}
      errors={errors}
      needsJustif={needsJustif}
      onChange={onChange}
      onChangeCosts={onChangeCosts}
      onDepartmentChange={handleDepartmentChange}
      setHeadEdited={() => {
        headEditedRef.current = true;
      }}
      isHeadRequester={isHeadRequester}
      isRepresentativeSubmission={isRepresentativeSubmission}
      requestingPersonHeadName={requestingPersonHeadName}
      currentUserName={currentUserName}
      // No footerRight - submission handled by SubmitBar at bottom
    />
  );
}
