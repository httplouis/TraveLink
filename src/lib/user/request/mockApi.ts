import type { RequestFormData } from "./types";
import { firstReceiver, fullApprovalPath } from "./routing";


export async function saveDraft(data: RequestFormData) {
// simulate persistence
await new Promise((r)=>setTimeout(r, 200));
localStorage.setItem("travilink_user_request_draft", JSON.stringify(data));
return { id: crypto.randomUUID(), savedAt: new Date().toISOString() };
}


export async function submitRequest(data: RequestFormData) {
await new Promise((r)=>setTimeout(r, 350));
return {
requestId: crypto.randomUUID(),
firstReceiver: firstReceiver({ requesterRole: data.requesterRole, vehicleMode: data.vehicleMode, reason: data.reason }),
approvalPath: fullApprovalPath({ requesterRole: data.requesterRole, vehicleMode: data.vehicleMode }),
submittedAt: new Date().toISOString(),
};
}