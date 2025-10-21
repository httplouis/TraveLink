// src/components/admin/notifications/hooks/useNotifications.ts
"use client";

import * as React from "react";
import type { Notification } from "@/lib/admin/notifications/types";
import {
  list,
  listUnread,
  markAllAsRead,
  markAsRead,
  pushMock,
} from "@/lib/admin/notifications/repo";

export type TabKey = "all" | "unread";

export function useNotifications() {
  const [tab, setTab] = React.useState<TabKey>("all");
  const [items, setItems] = React.useState<Notification[]>([]);
  const [unreadCount, setUnread] = React.useState<number>(0);

  const refresh = React.useCallback(() => {
    setItems(tab === "all" ? list(50) : listUnread());
    setUnread(listUnread().length);
  }, [tab]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const actions = {
    setTab,
    markOne: (id: string) => {
      markAsRead(id);
      refresh();
    },
    markAll: () => {
      markAllAsRead();
      refresh();
    },
    // demo/test injection (no actorName to match repo.ts signature)
    pushDemo: () => {
      pushMock({
        kind: "update",
        title: "New Travel Request submitted — REQ-2025-014",
        body: "Department: CCMS · Travel date: Oct 25, 9:00 AM",
        href: "/admin/requests/REQ-2025-014",
      });
      refresh();
    },
  };

  return { tab, items, unreadCount, ...actions };
}
