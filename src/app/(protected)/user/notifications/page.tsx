"use client";

import { useMemo, useState } from "react";
import NotificationsView, {
  NotificationItem,
  NotificationsTab,
} from "@/components/user/notification/NotificationsView";

export default function UserNotificationsPage() {
  // demo local state (replace with real fetch later)
  const [items, setItems] = useState<NotificationItem[]>([
    // sample structure
    // { id: "1", text: "Your request REQ-24013 was approved.", time: "2h ago", read: false },
    // { id: "2", text: "Schedule update: Bus departs 30 mins earlier.", time: "1d ago", read: true },
  ]);

  const [tab, setTab] = useState<NotificationsTab>("unread");

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items]
  );
  const allCount = items.length;

  function onMarkAllRead() {
    if (unreadCount === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function onRefresh() {
    // placeholder — fetch new data here later
    // e.g., revalidate or call your API
  }

  return (
    <NotificationsView
      tab={tab}
      unreadCount={unreadCount}
      allCount={allCount}
      items={items}
      onTabChange={setTab}
      onMarkAllRead={onMarkAllRead}
      onRefresh={onRefresh}
    />
  );
}
