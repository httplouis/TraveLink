// src/lib/admin/feedback/types.ts
export type Feedback = {
  id: string;
  createdAt: string;
  user: string;          // faculty/staff/student name
  message: string;       // feedback content
  rating?: number;       // optional stars 1-5
  status: "NEW" | "REVIEWED" | "RESOLVED";
};
