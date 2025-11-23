"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";

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

export default function HeadNotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inboxCount, setInboxCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const loadNotifications = async () => {
    try {
      const [notificationsRes, inboxRes] = await Promise.all([
        fetch("/api/notifications?limit=10", { 
          cache: "no-store",
          headers: { 'Cache-Control': 'no-cache' }
        }),
        fetch("/api/head?limit=5", { cache: "no-store" })
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
        title: "Request Pending Approval",
        message: `${item.requester?.name || 'Someone'} submitted a request that needs your approval.`,
        related_type: "request",
        related_id: item.id,
        action_url: "/head/inbox",
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
      
      const unread = uniqueNotifications.filter((n: Notification) => !n.is_read || n.is_read === false);
      setUnreadCount(unread.length);
    } catch (error) {
      console.error("[HeadNotificationDropdown] Failed to load notifications:", error);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const loadInboxCount = async () => {
    try {
      const res = await fetch("/api/head/inbox/count", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setInboxCount(data.pending_count || 0);
      }
    } catch (error) {
      console.error("Failed to load inbox count:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let channel: any = null;
    let requestsChannel: any = null;
    
    // Initial load
    loadNotifications();
    loadInboxCount();
    
    // Set up real-time subscriptions
    const setupRealtime = async () => {
      const supabase = createSupabaseClient();
      
      // Get current user profile ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();
      
      if (!profile) return;
      const currentUserId = profile.id;
      
      // Subscribe to notifications table changes
      channel = supabase
        .channel("head-notifications-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
          },
          (payload: any) => {
            if (!isMounted) return;
            const notificationUserId = payload.new?.user_id || payload.old?.user_id;
            if (notificationUserId === currentUserId) {
              loadNotifications();
            }
          }
        )
        .subscribe();
      
      // Subscribe to requests table changes (for inbox items)
      requestsChannel = supabase
        .channel("head-inbox-requests-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "requests",
          },
          (payload: any) => {
            if (!isMounted) return;
            const newStatus = payload.new?.status;
            const oldStatus = payload.old?.status;
            // Only react to changes that affect head inbox
            if (newStatus === "pending_head" || oldStatus === "pending_head" ||
                newStatus === "pending_parent_head" || oldStatus === "pending_parent_head") {
              loadNotifications();
              loadInboxCount();
            }
          }
        )
        .subscribe();
    };
    
    setupRealtime();
    
    // Fallback polling every 30 seconds
    const interval = setInterval(() => {
      if (isMounted) {
        loadNotifications();
        loadInboxCount();
      }
    }, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
      if (channel) {
        const supabase = createSupabaseClient();
        supabase.removeChannel(channel);
      }
      if (requestsChannel) {
        const supabase = createSupabaseClient();
        supabase.removeChannel(requestsChannel);
      }
    };
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notificationId, is_read: true }),
      });
      loadNotifications();
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: unreadIds, is_read: true }),
      });
      loadNotifications();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setIsOpen(false);
    
    if (!notification.is_read && !notification.id.startsWith('inbox-')) {
      markAsRead(notification.id).catch(console.error);
    }
    
    if (notification.notification_type === "request_pending_approval" && notification.related_id) {
      router.prefetch(`/head/inbox?view=${notification.related_id}`);
      router.push(`/head/inbox?view=${notification.related_id}`);
    } 
    else if (notification.related_id && notification.related_type === "request") {
      router.prefetch(`/head/request/submissions?view=${notification.related_id}`);
      router.push(`/head/request/submissions?view=${notification.related_id}`);
    } else if (notification.action_url) {
      router.prefetch(notification.action_url);
      router.push(notification.action_url);
    } else {
      router.prefetch(`/head/request/submissions`);
      router.push(`/head/request/submissions`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "request_approved":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "request_rejected":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "request_pending":
      case "request_pending_approval":
        return <Clock className="h-5 w-5 text-yellow-600" />;
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
            router.prefetch('/head/inbox');
            router.prefetch('/head/request/submissions');
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
        <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-[#7a0019] hover:text-[#5a0010] font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-[500px]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  You'll see updates about your requests here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 cursor-pointer transition-colors ${
                      !notification.is_read
                        ? "bg-blue-50 hover:bg-blue-100"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.notification_type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <span className="flex-shrink-0 h-2 w-2 bg-[#7a0019] rounded-full mt-1"></span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-500">
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
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-center">
              <button
                onClick={() => {
                  router.push("/head/notifications");
                  setIsOpen(false);
                }}
                className="text-sm text-[#7a0019] hover:text-[#5a0010] font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

