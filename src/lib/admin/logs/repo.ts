import type { LogEntry } from "./types";

const LS_KEY = "tl_logs_v2";
const nowISO = () => new Date().toISOString();
const uid = () => (globalThis.crypto?.randomUUID?.() ?? `l_${Math.random().toString(36).slice(2)}`);

const seed: LogEntry[] = [
  { id: uid(), timestampISO: nowISO(), actorType:"admin", actorName:"Admin",
    action:"login", entityType:"auth", severity:"info", details:"Signed in", ip:"127.0.0.1" },
  { id: uid(), timestampISO: new Date(Date.now()-1*60*60*1000).toISOString(), actorType:"admin", actorName:"Admin",
    action:"create", entityType:"maintenance", entityId:"m_001", entityLabel:"BUS-01 Oil change",
    severity:"info", details:"Created maintenance record" },
  { id: uid(), timestampISO: new Date(Date.now()-3*60*60*1000).toISOString(), actorType:"system", actorName:"System",
    action:"update", entityType:"vehicle", entityId:"v_001", entityLabel:"BUS-01",
    severity:"warning", details:"Odometer sync failed; retrying" },
  { id: uid(), timestampISO: new Date(Date.now()-26*60*60*1000).toISOString(), actorType:"driver", actorName:"D. Cruz",
    action:"status_change", entityType:"trip", entityId:"t_8842", entityLabel:"Trip #8842",
    severity:"info", details:"Departed" },
];

function loadRaw(): LogEntry[] {
  if (typeof window === "undefined") return seed;
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) { localStorage.setItem(LS_KEY, JSON.stringify(seed)); return seed; }
  try { return JSON.parse(raw) as LogEntry[]; } catch { return seed; }
}
function saveRaw(rows: LogEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(rows));
}

export const LogsRepo = {
  all(): LogEntry[] {
    return loadRaw().slice().sort((a,b)=> (a.timestampISO < b.timestampISO ? 1 : -1));
  },
  append(entry: Omit<LogEntry,"id"|"timestampISO">): LogEntry {
    const rows = loadRaw();
    const rec: LogEntry = { ...entry, id: uid(), timestampISO: nowISO() };
    rows.unshift(rec); saveRaw(rows); return rec;
  },
  remove(id: string) { saveRaw(loadRaw().filter(r => r.id !== id)); },
  clearAll() { saveRaw([]); },
};
