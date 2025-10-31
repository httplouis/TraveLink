function pad(n: number) { return String(n).padStart(2, "0"); }

export function startOfMonthISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
}

export function addMonths(anchorISO: string, delta: number) {
  const [y, m] = anchorISO.split("-").map(Number);
  const base = new Date(y, m - 1 + delta, 1);
  return startOfMonthISO(base);
}

export function monthMatrix(anchorISO: string) {
  const [y, m] = anchorISO.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const firstDay = new Date(first);
  firstDay.setDate(first.getDate() - first.getDay()); // back to Sunday

  const weeks: Date[][] = [];
  let cur = new Date(firstDay);

  for (let w = 0; w < 6; w++) {
    const row: Date[] = [];
    for (let d = 0; d < 7; d++) {
      row.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(row);
  }
  return weeks;
}

export function isSameMonth(date: Date, anchorISO: string) {
  const [y, m] = anchorISO.split("-").map(Number);
  return date.getFullYear() === y && date.getMonth() + 1 === m;
}

export function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function fmtMonthTitle(anchorISO: string) {
  const [y, m] = anchorISO.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString(undefined, { month: "long", year: "numeric" });
}
