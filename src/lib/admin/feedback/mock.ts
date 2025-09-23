// src/lib/admin/feedback/mock.ts
import type { Feedback } from "./types";

function iso(offsetDays = 0, hour = 9) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, Math.floor(Math.random() * 59), 0, 0);
  return d.toISOString();
}

export const MOCK_FEEDBACK: Feedback[] = [
  {
    id: "FB-0001",
    createdAt: iso(-6, 10),
    user: "Ana Santos",
    message: "Love the shuttle schedule view. Can we add a dark mode toggle?",
    rating: 5,
    status: "NEW",
  },
  {
    id: "FB-0002",
    createdAt: iso(-5, 14),
    user: "Registrar Office",
    message: "Sometimes the map pin does not center on mobile.",
    rating: 3,
    status: "REVIEWED",
  },
  {
    id: "FB-0003",
    createdAt: iso(-4, 15),
    user: "John Dela Cruz",
    message: "Please allow exporting request history by department.",
    rating: 4,
    status: "NEW",
  },
  {
    id: "FB-0004",
    createdAt: iso(-2, 11),
    user: "Maintenance",
    message: "UI labels overlap when zoom is 125%.",
    rating: 2,
    status: "RESOLVED",
  },
  {
    id: "FB-0005",
    createdAt: iso(-1, 9),
    user: "HR",
    message: "Add keyboard shortcut to open new feedback form.",
    rating: 4,
    status: "REVIEWED",
  },
];
