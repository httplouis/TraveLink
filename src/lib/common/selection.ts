// src/lib/common/selection.ts
export function toggleOne(set: (fn: (prev: Set<string>) => Set<string>) => void, id: string) {
  set((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
}

export function toggleAllOnPage(
  set: (fn: (prev: Set<string>) => Set<string>) => void,
  idsOnPage: string[],
  checked: boolean
) {
  set((prev) => {
    const next = new Set(prev);
    idsOnPage.forEach((id) => (checked ? next.add(id) : next.delete(id)));
    return next;
  });
}

export function clearSelection(set: (v: Set<string>) => void) {
  set(new Set());
}
