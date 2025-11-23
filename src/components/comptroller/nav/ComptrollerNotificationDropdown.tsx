"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  related_type?: string;
  related_id?: string;
  action_url?: string;
  action_label?: string;
  priority: string;
  is_read: boolean;
  created_at: string;
};

export default function ComptrollerNotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const loadNotifications = async () => {
    try {
      const [notificationsRes, inboxRes] = await Promise.all([
        fetch("/api/notifications?limit=10", { 
          cache: "no-store",
          headers: { 'Cache-Control': 'no-cache' }
        }),
        fetch("/api/comptroller/inbox?limit=5", { cache: "no-store" })
      ]);
      
      const [notificationsData, inboxData] = await Promise.all([
        notificationsRes.json(),
        inboxRes.json()
      ]);
      
      let notificationsList: Notification[] = [];
      
      if (notificationsData.ok) {
        notificationsList = Array.isArray(notificationsData.data) ? notificationsData.data : [];
      }

      const inboxItems = inboxData.ok && inboxData.data ? inboxData.data : [];
      const inboxRequestIds = new Set(inboxItems.map((item: any) => item.id));
      
      const filteredNotifications = notificationsList.filter((notif) => {
        if (notif.notification_type === "request_pending_approval" && notif.related_id) {
          return !inboxRequestIds.has(notif.related_id);
        }
        return true;
      });
      
      const inboxNotifications: Notification[] = inboxItems.map((item: any) => ({
        id: `inbox-${item.id}`,
        notification_type: "request_pending_approval",
        title: "Request Pending Budget Review",
        message: `${item.requester?.name || 'Someone'} submitted a request that needs your budget review.`,
        related_type: "request",
        related_id: item.id,
        action_url: "/comptroller/inbox",
        action_label: "Review Request",
        priority: "high",
        is_read: false,
        created_at: item.created_at || new Date().toISOString(),
      }));

      const allNotifications = [...filteredNotifications, ...inboxNotifications];
      const uniqueNotifications = Array.from(
        new Map(allNotifications.map(n => [n.related_id || n.id, n])).values()
      );
      
      uniqueNotifications.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });

      setNotifications(uniqueNotifications);
      
      const unread = uniqueNotifications.filter((n: Notification) => !n.is_read);
      setUnreadCount(unread.length);
    } catch (error) {
      console.error("[ComptrollerNotificationDropdown] Failed to load notifications:", error);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("[ComptrollerNotificationDropdown] Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read-all", {
        method: "POST",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("[ComptrollerNotificationDropdown] Failed to mark all as read:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.action_url) {
      router.push(notification.action_url);
      setIsOpen(false);
    }
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "request_approved":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "request_rejected":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "request_pending_approval":
        return <Clock className="h-5 w-5 text-amber-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            loadNotifications();
            router.prefetch('/comptroller/inbox');
          }
        }}
        className="relative rounded-full p-2 hover:bg-white/10 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-white px-[3px] text-[10px] leading-4 text-[#7a0019] font-semibold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
          {/* Header with Tabs */}
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="flex gap-2">
              <button
                onClick={() => setTab("all")}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  tab === "all"
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTab("unread")}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  tab === "unread"
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                Unread {unreadCount > 0 ? `(${unreadCount})` : ""}
              </button>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="rounded-md px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[70vh] overflow-auto p-2">
            {(() => {
              const filteredNotifications = tab === "unread" 
                ? notifications.filter(n => !n.is_read)
                : notifications;

              if (filteredNotifications.length === 0) {
                return (
                  <div className="py-10 text-center text-sm text-neutral-500">
                    {tab === "unread" ? "No unread notifications" : "No notifications"}
                  </div>
                );
              }

              return (
                <div className="space-y-1">
                  {filteredNotifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                        !notification.is_read ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.notification_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium ${
                              !notification.is_read ? "text-gray-900" : "text-gray-700"
                            }`}>
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <span className="flex-shrink-0 h-2 w-2 rounded-full bg-[#7a0019] mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                            {notification.action_label && (
                              <span className="text-xs text-[#7a0019] font-medium">
                                {notification.action_label} →
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>

          {notifications.length > 0 && (
            <div className="border-t px-3 py-2 text-center">
              <button
                onClick={() => {
                  router.push("/comptroller/inbox");
                  setIsOpen(false);
                }}
                className="rounded-lg px-3 py-1.5 text-sm text-[#7a0019] hover:bg-neutral-50 transition-colors"
              >
                See all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

