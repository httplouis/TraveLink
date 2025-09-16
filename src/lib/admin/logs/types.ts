export type ActorType = "admin" | "driver" | "faculty" | "system";
export type EntityType = "vehicle" | "request" | "trip" | "maintenance" | "driver" | "auth" | "system";
export type ActionType = "create" | "update" | "delete" | "status_change" | "login" | "logout" | "export" | "bulk";
export type Severity = "info" | "warning" | "error";

export type LogEntry = {
  id: string;
  timestampISO: string;
  actorType: ActorType;
  actorName: string;
  action: ActionType;
  entityType: EntityType;
  entityId?: string | null;
  entityLabel?: string | null;
  details?: string | null;
  severity: Severity;
  ip?: string | null;
};

export type LogFilters = {
  search?: string;
  actorType?: "" | ActorType;
  entityType?: "" | EntityType;
  action?: "" | ActionType;
  severity?: "" | Severity;
  dateFrom?: string;
  dateTo?: string;
};
