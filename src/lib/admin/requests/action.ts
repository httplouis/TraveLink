// Mock async actions (swap with real API calls later)
export async function approveRequests(ids: string[]) {
  await delay(300);
  return { ok: true, ids };
}
export async function rejectRequests(ids: string[]) {
  await delay(300);
  return { ok: true, ids };
}
export async function deleteRequests(ids: string[]) {
  await delay(300);
  return { ok: true, ids };
}
function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
