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

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inboxCount, setInboxCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load notifications and combine with inbox items - OPTIMIZED
  const loadNotifications = async () => {
    // Don't show loading spinner - just update silently
    try {
      console.log("[NotificationDropdown] Loading notifications...");
      // Load both in parallel for speed
      const [notificationsRes, inboxRes] = await Promise.all([
        fetch("/api/notifications?limit=50", { 
          cache: "no-store",
          headers: {
            'Cache-Control': 'no-cache'
          }
        }),
        fetch("/api/user/inbox?limit=5", { cache: "no-store" })
      ]);
      
      const [notificationsData, inboxData] = await Promise.all([
        notificationsRes.json(),
        inboxRes.json()
      ]);
      
      console.log("[NotificationDropdown] Notifications response:", {
        ok: notificationsData.ok,
        dataLength: notificationsData.data?.length || 0,
        data: notificationsData.data
      });
      
      let notificationsList: Notification[] = [];
      
      if (notificationsData.ok) {
        notificationsList = Array.isArray(notificationsData.data) ? notificationsData.data : [];
        console.log("[NotificationDropdown] Parsed notifications:", notificationsList.length);
      } else {
        console.error("[NotificationDropdown] Failed to load notifications:", notificationsData.error);
      }

      // Convert inbox items to notification format
      const inboxItems = inboxData.ok && inboxData.data ? inboxData.data : [];
      const inboxRequestIds = new Set(inboxItems.map((item: any) => item.id));
      
      // Filter out database notifications that are already represented by inbox items
      // (to avoid duplicates - inbox items are more up-to-date)
      const filteredNotifications = notificationsList.filter((notif) => {
        // If it's a signature required notification and the request is in inbox, skip it
        if (notif.notification_type === "request_pending_signature" && notif.related_id) {
          return !inboxRequestIds.has(notif.related_id);
        }
        return true; // Keep all other notifications
      });
      
      const inboxNotifications: Notification[] = inboxItems.map((item: any) => ({
        id: `inbox-${item.id}`,
        notification_type: "request_pending_signature",
        title: "Signature Required",
        message: `${item.submitted_by_name || 'Someone'} submitted a travel order request on your behalf. Please sign to proceed.`,
        related_type: "request",
        related_id: item.id,
        action_url: "/user/inbox",
        action_label: "Sign Request",
        priority: "high",
        is_read: false, // Inbox items are always unread
        created_at: item.created_at || new Date().toISOString(),
      }));

      // Combine filtered notifications and inbox items
      const allNotifications = [...filteredNotifications, ...inboxNotifications];
      const uniqueNotifications = Array.from(
        new Map(allNotifications.map(n => [n.related_id || n.id, n])).values()
      );
      
      // Sort by created_at descending
      uniqueNotifications.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });

      setNotifications(uniqueNotifications);
      
      const unread = uniqueNotifications.filter((n: Notification) => !n.is_read || n.is_read === false);
      setUnreadCount(unread.length);
      
      console.log("[NotificationDropdown] Final notifications:", {
        total: uniqueNotifications.length,
        unread: unread.length,
        notifications: uniqueNotifications.map(n => ({
          id: n.id,
          type: n.notification_type,
          title: n.title,
          is_read: n.is_read
        }))
      });
    } catch (error) {
      console.error("[NotificationDropdown] Failed to load notifications:", error);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // Load inbox count and items
  const loadInboxCount = async () => {
    try {
      const res = await fetch("/api/user/inbox/count", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setInboxCount(data.pending_count || 0);
      }
    } catch (error) {
      console.error("Failed to load inbox count:", error);
    }
  };


  // Load on mount and set up real-time subscription
  useEffect(() => {
    let isMounted = true;
    let channel: any = null;
    let requestsChannel: any = null;
    
    // Initial load
    loadNotifications();
    loadInboxCount();
    
    // Set up real-time subscription for notifications
    const setupRealtime = async () => {
      const supabase = createSupabaseClient();
      console.log("[NotificationDropdown] Setting up real-time subscription...");
      
      // Get current user profile ID first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("[NotificationDropdown] No user found, skipping real-time subscription");
        return;
      }
      
      const { data: profile } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();
      
      if (!profile) {
        console.log("[NotificationDropdown] No profile found, skipping real-time subscription");
        return;
      }
      
      const currentUserId = profile.id;
      console.log("[NotificationDropdown] Current user ID:", currentUserId);
      
      // Subscribe to notifications table changes
      channel = supabase
        .channel("user-notifications-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
          },
          (payload: any) => {
            if (!isMounted) return;
            
            // Filter by user_id in the handler
            const notificationUserId = payload.new?.user_id || payload.old?.user_id;
            if (notificationUserId !== currentUserId) {
              return; // Not for this user
            }
            
            console.log("[NotificationDropdown] 🔔 Real-time notification change:", {
              eventType: payload.eventType,
              user_id: notificationUserId,
              notification_id: payload.new?.id || payload.old?.id
            });
            
            // Reload notifications when there's a change
            if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
              loadNotifications();
              loadInboxCount();
            }
          }
        )
        .subscribe((status: string) => {
          console.log("[NotificationDropdown] Real-time subscription status:", status);
        });
      
      // Subscribe to requests table changes (for inbox items)
      requestsChannel = supabase
        .channel("user-inbox-requests-changes")
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
            const isRepresentative = payload.new?.is_representative;
            // Only react to changes that affect user inbox (representative submissions)
            if (isRepresentative && (newStatus === "pending_requester_signature" || 
                payload.eventType === "INSERT")) {
              console.log("[NotificationDropdown] 🔔 Real-time inbox request change");
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
      const supabase = createSupabaseClient();
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (requestsChannel) {
        supabase.removeChannel(requestsChannel);
      }
    };
  }, []);

  // Close dropdown when clicking outside
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

  // Mark notification as read
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

  // Mark all as read
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

  // Handle notification click - FAST navigation
  const handleNotificationClick = (notification: Notification) => {
    // Close dropdown immediately
    setIsOpen(false);
    
    // Mark as read in background (don't wait)
    if (!notification.is_read && !notification.id.startsWith('inbox-')) {
      markAsRead(notification.id).catch(console.error);
    }
    
    // Navigate immediately - use prefetch for faster loading
    if (notification.notification_type === "request_pending_signature" && notification.related_id) {
      // Prefetch the inbox page for instant loading
      router.prefetch(`/user/inbox?view=${notification.related_id}`);
      router.push(`/user/inbox?view=${notification.related_id}`);
    } 
    // Otherwise, navigate to the action URL or submissions
    else if (notification.related_id && notification.related_type === "request") {
      router.prefetch(`/user/submissions?view=${notification.related_id}`);
      router.push(`/user/submissions?view=${notification.related_id}`);
    } else if (notification.action_url) {
      router.prefetch(notification.action_url);
      router.push(notification.action_url);
    } else {
      router.prefetch(`/user/submissions`);
      router.push(`/user/submissions`);
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "request_approved":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "request_rejected":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "request_pending":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  // Format time ago
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
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          // Reload notifications when opening dropdown
          if (!isOpen) {
            loadNotifications();
            // Prefetch inbox and submissions pages for faster navigation
            router.prefetch('/user/inbox');
            router.prefetch('/user/submissions');
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

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-50">
          {/* Header */}
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

          {/* Notifications List */}
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
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.notification_type)}
                      </div>

                      {/* Content */}
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

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-center">
              <button
                onClick={() => {
                  router.push("/user/notifications");
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
