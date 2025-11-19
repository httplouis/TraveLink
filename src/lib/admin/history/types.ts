// src/lib/admin/history/types.ts

export type HistoryItem = {
  id: string;
  type: "request" | "maintenance";
  reference: string;
  title: string;
  description: string;
  department: string;
  requester: string;
  vehicle: string;
  driver: string;
  status: "Completed" | "Approved";
  cost?: number;
  date: string;
  created_at: string;
  updated_at: string;
};

export type HistoryFilters = {
  type?: "all" | "requests" | "maintenance";
  search?: string;
  department?: string;
  status?: string;
  from?: string;
  to?: string;
};

export type HistoryStats = {
  totalRequests: number;
  totalMaintenance: number;
  totalCost: number;
  completedThisMonth: number;
};

