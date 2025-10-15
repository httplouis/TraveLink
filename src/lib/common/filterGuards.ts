export function makeGuard<T extends readonly string[]>(values: T) {
  const set = new Set(values as readonly string[]);
  return (v: string): v is T[number] => set.has(v);
}
