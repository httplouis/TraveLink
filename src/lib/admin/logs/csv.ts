import type { LogEntry } from "./types";

export function toCSV(rows: LogEntry[]): string {
  const head = [
    "ID","TimestampISO","ActorType","ActorName","Action","EntityType","EntityId","EntityLabel","Severity","IP","Details"
  ];
  const lines = rows.map(r => [
    r.id, r.timestampISO, r.actorType, r.actorName, r.action, r.entityType, r.entityId ?? "", r.entityLabel ?? "", r.severity, r.ip ?? "",
    (r.details ?? "").replaceAll("\n"," ").replaceAll('"','""')
  ].map(x => `"${String(x)}"`).join(","));
  return [head.join(","), ...lines].join("\n");
}
