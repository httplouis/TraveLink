import type { LogEntry, LogFilters } from "./types";
import { LogsRepo } from "./repo";
import { applyFilters } from "./service";
import { toCSV } from "./csv";
import { countBySeverity, countByAction, trendLast7Days } from "./analytics";

export function loadLogs(filters?: LogFilters): LogEntry[] {
  return applyFilters(LogsRepo.all(), filters);
}

export function getAnalytics(rows: LogEntry[]) {
  return {
    totals: {
      all: rows.length,
      ...countBySeverity(rows),
    },
    topActions: countByAction(rows),
    trend7d: trendLast7Days(rows),
  };
}

export function addLog(entry: Omit<LogEntry,"id"|"timestampISO">): LogEntry {
  return LogsRepo.append(entry);
}

export function deleteLog(id: string) { LogsRepo.remove(id); }
export function clearLogs() { LogsRepo.clearAll(); }

export function exportLogsCSV(rows: LogEntry[]): Blob {
  const csv = toCSV(rows);
  return new Blob([csv], { type: "text/csv;charset=utf-8;" });
}
