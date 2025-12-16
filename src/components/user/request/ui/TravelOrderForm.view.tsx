// src/components/user/request/ui/TravelOrderForm.view.tsx
"use client";

import * as React from "react";
import TopGridFields from "./parts/TopGridFields.view";
import CostsSection from "./parts/CostsSection.view";
import EndorsementSection from "./parts/EndorsementSection.view";
import FileAttachmentSection from "./parts/FileAttachmentSection.view";
import HeadEndorsementStatus from "./HeadEndorsementStatus";
import HeadEndorsementInvitationEditor from "./HeadEndorsementInvitationEditor";
import { UI_TEXT } from "@/lib/user/request/uiText";

type ViewProps = {
  data: any;
  errors: Record<string, string>;
  needsJustif: boolean;
  onChange: (patch: any) => void;
  onChangeCosts: (patch: any) => void;
  onDepartmentChange: (dept: string) => void;
  setHeadEdited: () => void;
  footerRight?: React.ReactNode;

  // extra props
  isHeadRequester?: boolean;
  isRepresentativeSubmission?: boolean;
  requestingPersonHeadName?: string; // Head name for requesting person's department
  currentUserName?: string;
  requesterRole?: "faculty" | "head"; // Role type to determine if multiple requesters are allowed
  requestId?: string; // Request ID for sending invitations (after saving)
  currentUserEmail?: string; // Current logged-in user's email (for auto-confirm)
  onRequestersStatusChange?: (allConfirmed: boolean) => void; // Callback when all requesters are confirmed
  onHeadEndorsementsStatusChange?: (allConfirmed: boolean) => void; // Callback when all head endorsements are confirmed
  onAutoSaveRequest?: () => Promise<string | null>; // Callback to auto-save draft and return requestId
  vehicleMode?: "owned" | "institutional" | "rent"; // Vehicle mode to control cost fields visibility
};

export default function TravelOrderFormView({
  data,
  errors,
  needsJustif,
  onChange,
  onChangeCosts,
  onDepartmentChange,
  setHeadEdited,
  footerRight,
  isHeadRequester,
  isRepresentativeSubmission,
  requestingPersonHeadName,
  currentUserName,
  requesterRole,
  requestId,
  currentUserEmail,
  onRequestersStatusChange,
  onHeadEndorsementsStatusChange,
  onAutoSaveRequest,
  vehicleMode,
}: ViewProps) {
  const c = data?.costs || {};

  // Check if there are multiple departments from requesters
  const hasMultipleDepartments = React.useMemo(() => {
    const requesters = Array.isArray(data?.requesters) ? data.requesters : [];
    if (requesters.length <= 1) return false;
    
    const departments = requesters
      .map((req: any) => req.department)
      .filter((dept: any): dept is string => !!dept && dept.trim() !== "");
    
    const uniqueDepartments = Array.from(
      new Set(departments.map((dept: string) => dept.trim()))
    );
    
    return uniqueDepartments.length > 1;
  }, [data?.requesters]);

  // Auto-detect heads for each department (for multi-department scenarios)
  const [headEndorsements, setHeadEndorsements] = React.useState<Array<{
    id: string;
    head_name: string;
    head_email?: string;
    department_name: string;
    department_id?: string;
    head_user_id?: string;
    status?: 'pending' | 'sent' | 'confirmed' | 'declined' | 'expired';
    invitationId?: string;
    signature?: string;
    confirmed_at?: string;
  }>>([]);

  // Get current user info to exclude their department if they're a head
  const [currentUserInfo, setCurrentUserInfo] = React.useState<{ id?: string; department_id?: string; is_head?: boolean; email?: string } | null>(null);
  
  React.useEffect(() => {
    // Fetch current user info
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.data) {
          const userInfo = {
            id: data.data.id,
            department_id: data.data.department_id,
            is_head: data.data.is_head || data.data.role === 'head',
            email: data.data.email,
          };
          console.log('[TravelOrderFormView] ✅ Current user info:', userInfo);
          setCurrentUserInfo(userInfo);
        }
      })
      .catch(err => console.error('[TravelOrderFormView] Error fetching current user:', err));
  }, []);

  // Auto-fetch heads when requesters change
  React.useEffect(() => {
    if (!hasMultipleDepartments) {
      setHeadEndorsements([]);
      return;
    }

    const fetchHeads = async () => {
      const requesters = Array.isArray(data?.requesters) ? data.requesters : [];
      console.log(`[TravelOrderFormView] 🔍 Fetching heads for requesters:`, requesters.map((r: any) => ({
        name: r.name,
        email: r.email,
        department: r.department,
        department_id: r.department_id,
        user_id: r.user_id,
      })));
      
      const departments = new Map<string, { department_id?: string; department_name: string }>();
      
      // Get unique departments from requesters
      // CRITICAL: If requester has user_id, fetch their actual department_id from database
      // This ensures we use the correct department_id even if form data is stale
      const requesterPromises = requesters.map(async (req: any) => {
        // If requester has user_id, fetch their current department_id from database
        if (req.user_id && (!req.department_id || req.department_id === 'undefined' || req.department_id === 'null')) {
          try {
            console.log(`[TravelOrderFormView] 🔍 Fetching department_id for requester ${req.name} (user_id: ${req.user_id})`);
            const userResponse = await fetch(`/api/users/${req.user_id}`);
            const userData = await userResponse.json();
            if (userData.ok && userData.data?.department_id) {
              console.log(`[TravelOrderFormView] ✅ Found department_id for ${req.name}: ${userData.data.department_id}`);
              return {
                ...req,
                department_id: userData.data.department_id,
                department: userData.data.department || req.department,
              };
            }
          } catch (err) {
            console.error(`[TravelOrderFormView] Error fetching user ${req.user_id}:`, err);
          }
        }
        return req;
      });
      
      const resolvedRequesters = await Promise.all(requesterPromises);
      console.log(`[TravelOrderFormView] 📋 Resolved requesters:`, resolvedRequesters.map((r: any) => ({
        name: r.name,
        department: r.department,
        department_id: r.department_id,
      })));
      
      // Use resolved requesters instead of original
      const uniqueDepartments = new Map<string, { department_id?: string; department_name: string }>();
      
      resolvedRequesters.forEach((req: any) => {
        if (req.department && req.department.trim()) {
          // Use department_id as primary key if available
          const deptKey = req.department_id || req.department.trim().toLowerCase();
          
          // If we already have this department_id, skip
          if (req.department_id && uniqueDepartments.has(req.department_id)) {
            return;
          }
          
          // If we already have this department name (and no ID), skip
          if (!req.department_id && uniqueDepartments.has(req.department.trim().toLowerCase())) {
            return;
          }
          
          // If department_id exists, use it as the key
          if (req.department_id) {
            uniqueDepartments.set(req.department_id, {
              department_id: req.department_id,
              department_name: req.department,
            });
          } else {
            // Fallback to department name as key
            uniqueDepartments.set(req.department.trim().toLowerCase(), {
              department_id: undefined, // Will need to fetch from API
              department_name: req.department,
            });
          }
        }
      });
      
      console.log(`[TravelOrderFormView] 📋 Unique departments found:`, Array.from(uniqueDepartments.values()).map(d => ({
        name: d.department_name,
        id: d.department_id,
      })));

      // EXCLUDE main requester's department if they're a head
      // Also exclude if the first requester (main requester) is a head and this is their department
      const firstRequester = resolvedRequesters[0];
      // Check by user_id OR by email (more robust)
      const firstRequesterIsHead = (firstRequester?.user_id && currentUserInfo?.id && firstRequester.user_id === currentUserInfo.id && currentUserInfo.is_head) ||
        (firstRequester?.email && currentUserInfo?.email && firstRequester.email.toLowerCase() === currentUserInfo.email.toLowerCase() && currentUserInfo.is_head);
      const firstRequesterDeptId = firstRequester?.department_id;
      
      const departmentsNeedingEndorsement = Array.from(uniqueDepartments.values()).filter(dept => {
        // Exclude if current user is a head and this is their department
        if (currentUserInfo?.is_head && currentUserInfo?.department_id && dept.department_id === currentUserInfo.department_id) {
          console.log(`[TravelOrderFormView] ⏭️ Excluding current user's department (head is requester): ${dept.department_name} (dept_id: ${dept.department_id})`);
          return false;
        }
        
        // Also exclude if first requester is the current user (head) and this is their department
        if (firstRequesterIsHead && firstRequesterDeptId && dept.department_id === firstRequesterDeptId) {
          console.log(`[TravelOrderFormView] ⏭️ Excluding first requester's department (head is requester): ${dept.department_name} (dept_id: ${dept.department_id})`);
          return false;
        }
        
        // Also check if ANY requester in this department is the current user (head)
        // This handles cases where the current user is not the first requester
        const requesterInThisDept = resolvedRequesters.find(req => {
          const reqDeptId = req.department_id;
          const matchesDept = reqDeptId && reqDeptId === dept.department_id;
          if (!matchesDept) return false;
          
          // Check if this requester is the current user (by user_id or email)
          const isCurrentUser = (req.user_id && currentUserInfo?.id && req.user_id === currentUserInfo.id) ||
            (req.email && currentUserInfo?.email && req.email.toLowerCase() === currentUserInfo.email.toLowerCase());
          return isCurrentUser && currentUserInfo?.is_head;
        });
        
        if (requesterInThisDept) {
          console.log(`[TravelOrderFormView] ⏭️ Excluding department ${dept.department_name} - current user (head) is a requester in this department`);
          return false;
        }
        
        // NEW: Check if ANY requester in this department is a head (not just current user)
        // This handles cases where a head from another department is added as a requester
        const headRequesterInThisDept = resolvedRequesters.find(req => {
          const reqDeptId = req.department_id;
          const matchesDept = reqDeptId && reqDeptId === dept.department_id;
          if (!matchesDept) return false;
          
          // Check if this requester is a head (from is_head field stored in requester data)
          return req.is_head === true;
        });
        
        if (headRequesterInThisDept) {
          console.log(`[TravelOrderFormView] ⏭️ Excluding department ${dept.department_name} - a head requester is in this department`);
          return false;
        }
        
        return true;
      });

      console.log(`[TravelOrderFormView] 🔍 Head endorsement check:`, {
        totalDepartments: uniqueDepartments.size,
        departmentsNeedingEndorsement: departmentsNeedingEndorsement.length,
        currentUserIsHead: currentUserInfo?.is_head,
        currentUserDept: currentUserInfo?.department_id,
        currentUserEmail: currentUserInfo?.email,
        allDepartments: Array.from(uniqueDepartments.values()).map(d => ({ name: d.department_name, id: d.department_id })),
        filteredDepartments: departmentsNeedingEndorsement.map(d => ({ name: d.department_name, id: d.department_id })),
      });

      // Fetch head for each department that needs endorsement
      const headsPromises = departmentsNeedingEndorsement.map(async (dept, idx) => {
        // If no department_id, try to fetch it from department name
        let finalDeptId = dept.department_id;
        if (!finalDeptId && dept.department_name) {
          try {
            const deptResponse = await fetch(`/api/departments?name=${encodeURIComponent(dept.department_name)}`);
            const deptData = await deptResponse.json();
            if (deptData.ok && deptData.departments?.[0]?.id) {
              finalDeptId = deptData.departments[0].id;
              console.log(`[TravelOrderFormView] ✅ Resolved department_id for ${dept.department_name}: ${finalDeptId}`);
            }
          } catch (err) {
            console.error(`[TravelOrderFormView] Error resolving department_id for ${dept.department_name}:`, err);
          }
        }
        
        if (!finalDeptId) {
          console.warn(`[TravelOrderFormView] ⚠️ No department_id for ${dept.department_name}, skipping`);
          return null;
        }
        
        try {
          console.log(`[TravelOrderFormView] 🔍 Fetching head for ${dept.department_name} (department_id: ${finalDeptId})`);
          const response = await fetch(`/api/approvers?role=head&department_id=${finalDeptId}`);
          const headData = await response.json();
          
          console.log(`[TravelOrderFormView] 📥 API response for ${dept.department_name}:`, {
            ok: headData.ok,
            count: headData.data?.length || 0,
            target_dept_id: finalDeptId,
            heads: headData.data?.map((h: any) => ({ 
              name: h.name, 
              email: h.email, 
              dept_id: h.department_id,
              matches_target: h.department_id === finalDeptId
            })),
            full_response: headData
          });
          
          if (headData.ok && headData.data && headData.data.length > 0) {
            // CRITICAL: Only use heads where department_id matches EXACTLY
            // Reject any head that has a different department_id
            const matchingHeads = headData.data.filter((h: any) => {
              if (h.department_id && h.department_id !== finalDeptId) {
                console.warn(`[TravelOrderFormView] ❌ REJECTING ${h.name} - department_id mismatch: ${h.department_id} !== ${finalDeptId}`);
                return false;
              }
              // Only accept if department_id matches OR is null/undefined (fallback case)
              return h.department_id === finalDeptId || !h.department_id;
            });
            
            if (matchingHeads.length === 0) {
              console.error(`[TravelOrderFormView] ❌ NO VALID HEADS found for ${dept.department_name} (department_id: ${finalDeptId})`);
              console.error(`[TravelOrderFormView]   - API returned ${headData.data.length} head(s), but none matched department_id`);
              console.error(`[TravelOrderFormView]   - Returned heads:`, headData.data.map((h: any) => ({ 
                name: h.name, 
                email: h.email,
                dept_id: h.department_id, 
                target: finalDeptId,
                matches: h.department_id === finalDeptId
              })));
              console.error(`[TravelOrderFormView]   - This is a CRITICAL API BUG - the API should not return heads with wrong department_id!`);
              console.error(`[TravelOrderFormView]   - Please check server logs for /api/approvers to see which fallback path returned the wrong head`);
              // Don't return null - let the user see there's an issue, but don't show wrong head
              return null;
            }
            
            // Use the first matching head (should only be one)
            const matchingHead = matchingHeads[0];
            
            console.log(`[TravelOrderFormView] ✅ Selected head for ${dept.department_name}: ${matchingHead.name} (email: ${matchingHead.email}, dept_id: ${matchingHead.department_id || 'N/A'})`);
            
            // Final verification
            if (matchingHead.department_id && matchingHead.department_id !== finalDeptId) {
              console.error(`[TravelOrderFormView] 🚨 CRITICAL ERROR: Head ${matchingHead.name} has different department_id (${matchingHead.department_id} vs ${finalDeptId}) - this should not happen!`);
              return null;
            }
            
            // EXTRA SAFETY: Verify the head's user_id actually belongs to this department
            // by checking their actual department_id from the database
            if (matchingHead.id) {
              try {
                const userVerifyResponse = await fetch(`/api/users/${matchingHead.id}`);
                const userVerifyData = await userVerifyResponse.json();
                if (userVerifyData.ok && userVerifyData.data) {
                  const actualDeptId = userVerifyData.data.department_id;
                  if (actualDeptId && actualDeptId !== finalDeptId) {
                    console.error(`[TravelOrderFormView] 🚨 VERIFICATION FAILED: Head ${matchingHead.name} (user_id: ${matchingHead.id}) has actual department_id ${actualDeptId} but we're looking for ${finalDeptId} - REJECTING`);
                    return null;
                  }
                  console.log(`[TravelOrderFormView] ✅ Verified: Head ${matchingHead.name} has correct department_id ${actualDeptId}`);
                }
              } catch (verifyErr) {
                console.warn(`[TravelOrderFormView] ⚠️ Could not verify head's department_id:`, verifyErr);
                // Continue anyway, but log the warning
              }
            }
            
            // EXCLUDE if head is the current user (auto-confirm will handle this)
            if (currentUserEmail && matchingHead.email && matchingHead.email.toLowerCase() === currentUserEmail.toLowerCase()) {
              console.log(`[TravelOrderFormView] ⏭️ Excluding head ${matchingHead.name} - they are the current user, will auto-confirm`);
              return null;
            }
            
            return {
              id: `head-${finalDeptId}-${idx}`,
              head_name: matchingHead.name || "Department Head",
              head_email: matchingHead.email,
              department_name: dept.department_name,
              department_id: finalDeptId,
              head_user_id: matchingHead.id,
              status: 'pending' as const,
            };
          } else {
            console.warn(`[TravelOrderFormView] ⚠️ No head found for ${dept.department_name} (department_id: ${finalDeptId})`, headData);
          }
        } catch (err) {
          console.error(`[TravelOrderFormView] Error fetching head for ${dept.department_name}:`, err);
        }
        return null;
      });

      const heads = (await Promise.all(headsPromises)).filter((h): h is NonNullable<typeof h> => h !== null);
      console.log(`[TravelOrderFormView] ✅ Found ${heads.length} head(s) needing endorsement:`, heads.map(h => ({ name: h.head_name, dept: h.department_name })));
      setHeadEndorsements(heads);
    };

    fetchHeads();
  }, [hasMultipleDepartments, data?.requesters, currentUserInfo]);

  // Handle head endorsements change
  const handleHeadEndorsementsChange = React.useCallback((updatedHeads: typeof headEndorsements) => {
    setHeadEndorsements(updatedHeads);
    // Check if all are confirmed
    const allConfirmed = updatedHeads.length > 0 && updatedHeads.every(h => h.status === 'confirmed');
    onHeadEndorsementsStatusChange?.(allConfirmed);
  }, [onHeadEndorsementsStatusChange]);

  // Debug: Log props
  React.useEffect(() => {
    console.log('[TravelOrderFormView] Props received:');
    console.log('  - isRepresentativeSubmission:', isRepresentativeSubmission);
    console.log('  - isHeadRequester:', isHeadRequester);
    console.log('  - hasMultipleDepartments:', hasMultipleDepartments);
  }, [isRepresentativeSubmission, isHeadRequester, hasMultipleDepartments]);

  return (
    <section className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white via-gray-50/30 to-white p-7 shadow-xl">
      <div className="mb-7 flex items-center justify-between border-b-2 border-gray-200 pb-5">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{UI_TEXT.title}</h3>
          <p className="mt-2 text-sm text-gray-600">Complete all required fields to submit your travel request</p>
        </div>
        <div className="rounded-lg border border-[#7A0010]/20 bg-gradient-to-br from-[#7A0010]/5 to-[#7A0010]/10 px-4 py-2 shadow-sm">
          <span className="text-xs font-semibold text-[#7A0010]">{UI_TEXT.requiredHint}</span>
        </div>
      </div>

      {/* Top half: date, requester, dept, destination, purpose */}
      <TopGridFields
        onAutoSaveRequest={onAutoSaveRequest}
        data={data}
        errors={errors}
        onChange={onChange}
        onDepartmentChange={onDepartmentChange}
        isHeadRequester={isHeadRequester}
        isRepresentativeSubmission={isRepresentativeSubmission}
        requesterRole={requesterRole}
        requestId={requestId}
        currentUserEmail={currentUserEmail}
        onRequestersStatusChange={onRequestersStatusChange}
      />

      <CostsSection
        costs={c}
        needsJustif={needsJustif}
        errors={errors}
        onChangeCosts={onChangeCosts}
        vehicleMode={vehicleMode}
      />

      {/* File Attachments Section */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <FileAttachmentSection
          attachments={data?.attachments || []}
          onChange={(attachments) => onChange({ attachments })}
          errors={errors}
        />
      </div>

      {/* Head details + (optionally) signature kapag head mismo nagrerequest */}
      <EndorsementSection
        nameValue={hasMultipleDepartments || isHeadRequester
          ? "" // Clear if multiple departments (handled via email) or if head is requester
          : (isRepresentativeSubmission && requestingPersonHeadName 
            ? requestingPersonHeadName 
            : (data?.endorsedByHeadName ?? ""))}
        dateValue={hasMultipleDepartments ? "" : (data?.endorsedByHeadDate ?? "")}
        onNameChange={(v) => {
          setHeadEdited();
          onChange({ endorsedByHeadName: v });
        }}
        onDateChange={(v) => onChange({ endorsedByHeadDate: v })}
        isHeadRequester={isHeadRequester}
        currentUserName={currentUserName}
        hasMultipleDepartments={hasMultipleDepartments}
        // kung may na-upload na e-signature ng head (head requester case)
        signature={hasMultipleDepartments ? null : (data?.endorsedByHeadSignature ?? null)}
        onSignatureChange={(dataUrl) => {
          onChange({ endorsedByHeadSignature: dataUrl });
        }}
        onAutoSaveRequest={onAutoSaveRequest}
      />

      {/* Head Endorsement Invitation Editor (for multi-department scenarios - BEFORE submission) */}
      {hasMultipleDepartments && headEndorsements.length > 0 && (
        <HeadEndorsementInvitationEditor
          heads={headEndorsements}
          onChange={handleHeadEndorsementsChange}
          requestId={requestId}
          onStatusChange={onHeadEndorsementsStatusChange}
          currentUserEmail={currentUserEmail}
          onAutoSaveRequest={onAutoSaveRequest}
        />
      )}

      {/* Head Endorsement Status (for multi-department scenarios - AFTER submission) */}
      {requestId && hasMultipleDepartments && (
        <HeadEndorsementStatus
          requestId={requestId}
          onAllConfirmed={onHeadEndorsementsStatusChange}
        />
      )}

      <div className="mt-5 flex items-center justify-end gap-2">{footerRight}</div>
    </section>
  );
}
