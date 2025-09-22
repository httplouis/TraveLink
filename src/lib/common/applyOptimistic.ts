export async function applyOptimistic<Row>(
  currentRows: Row[],
  setRows: (rows: Row[]) => void,
  ids: string[],
  mutate: (rows: Row[], ids: string[]) => Row[],   // produce next rows
  apiCall: () => Promise<unknown>,                 // remote call
  onSuccess?: () => void,
  onError?: () => void
) {
  const snapshot = currentRows;
  const next = mutate(snapshot, ids);
  setRows(next);
  try {
    await apiCall();
    onSuccess?.();
  } catch (e) {
    setRows(snapshot);
    onError?.();
  }
}
