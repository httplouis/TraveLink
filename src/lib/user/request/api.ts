// src/lib/user/request/api.ts
export async function submitTravelOrderToApi(payload: any) {
  const res = await fetch("/api/requests/submit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      // TODO: palitan ng totoong user id pag may auth ka na
      user_id: "00000000-0000-0000-0000-000000000000",
      current_status: payload?.isHeadRequester ? "admin_received" : "pending_head",
      payload: {
        travelOrder: payload,
      },
    }),
  });

  const json = await res.json();
  if (!json.ok) {
    throw new Error(json.error || "Failed to submit travel order");
  }
  return json.data;
}
