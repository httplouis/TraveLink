import type { LogEntry, LogFilters, ActorType, EntityType, ActionType, Severity } from "./types";

export const LogConstants = {
  actorTypes: ["admin","driver","faculty","system"] as const satisfies readonly ActorType[],
  entityTypes: ["vehicle","request","trip","maintenance","driver","auth","system"] as const satisfies readonly EntityType[],
  actions: ["create","update","delete","status_change","login","logout","export","bulk"] as const satisfies readonly ActionType[],
  severities: ["info","warning","error"] as const satisfies readonly Severity[],
};

export function applyFilters(rows: LogEntry[], f?: LogFilters): LogEntry[] {
  if (!f) return rows;

  const q = (f.search ?? "").toLowerCase().trim();
  const from = f.dateFrom ? new Date(f.dateFrom + "T00:00:00") : null;
  const to = f.dateTo ? new Date(f.dateTo + "T23:59:59") : null;

  return rows.filter(r => {
    const okQ = !q || [
      r.actorName, r.action, r.entityType, r.entityLabel ?? "", r.details ?? "", r.severity, r.ip ?? ""
    ].join(" ").toLowerCase().includes(q);

    const okActor = !f.actorType || r.actorType === f.actorType;
    const okEntity = !f.entityType || r.entityType === f.entityType;
    const okAction = !f.action || r.action === f.action;
    const okSev = !f.severity || r.severity === f.severity;

    const t = new Date(r.timestampISO);
    const okFrom = !from || t >= from;
    const okTo = !to || t <= to;

    return okQ && okActor && okEntity && okAction && okSev && okFrom && okTo;
  });
}
