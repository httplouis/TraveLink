// src/components/admin/notifications/hooks/useNotifications.ts
"use client";

import * as React from "react";
import type { Notification } from "@/lib/admin/notifications/types";
import { createSupabaseClient } from "@/lib/supabase/client";

export type TabKey = "all" | "unread";

// Map database notification to UI notification type
function mapDbNotificationToUI(dbNotif: any): Notification {
  // Determine kind based on notification_type
  let kind: Notification["kind"] = "update";
  if (dbNotif.notification_type?.includes("comment")) {
    kind = "comment";
  } else if (dbNotif.notification_type?.includes("mention")) {
    kind = "mention";
  } else if (dbNotif.notification_type?.includes("tag")) {
    kind = "tag";
  }

  // Build href from action_url or related_id
  let href: string | undefined = undefined;
  if (dbNotif.action_url) {
    href = dbNotif.action_url;
  } else if (dbNotif.related_id && dbNotif.related_type === "request") {
    // For request-related notifications, link to admin requests view
    href = `/admin/requests?view=${dbNotif.related_id}`;
  }

  return {
    id: dbNotif.id,
    kind,
    title: dbNotif.title || "Notification",
    body: dbNotif.message || undefined,
    createdAt: dbNotif.created_at || new Date().toISOString(),
    read: dbNotif.is_read || false,
    actorName: undefined, // Database doesn't have actor_name column
    actorAvatarUrl: null, // Database doesn't have actor_avatar_url column
    href,
    meta: {
      notification_type: dbNotif.notification_type,
      related_type: dbNotif.related_type,
      related_id: dbNotif.related_id,
      priority: dbNotif.priority,
    },
  };
}

export function useNotifications() {
  const [tab, setTab] = React.useState<TabKey>("all");
  const [items, setItems] = React.useState<Notification[]>([]);
  const [unreadCount, setUnread] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    try {
      setLoading(true);
      const unreadParam = tab === "unread" ? "?unread=true" : "";
      const limitParam = unreadParam ? "&limit=50" : "?limit=50";
      const res = await fetch(`/api/notifications${unreadParam}${limitParam}`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) {
        // Only log non-404 errors (404 might be temporary during build/hot reload)
        if (res.status !== 404) {
          console.error("[useNotifications] API response not OK:", res.status, res.statusText);
        }
        setItems([]);
        setUnread(0);
        return;
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("[useNotifications] API returned non-JSON response. Content-Type:", contentType);
        setItems([]);
        setUnread(0);
        return;
      }
      const json = await res.json();
      
      if (json.ok && json.data) {
        const mapped = json.data.map(mapDbNotificationToUI);
        setItems(mapped);
        
        // Count unread
        const unread = mapped.filter((n: Notification) => !n.read).length;
        setUnread(unread);
      } else {
        console.error("[useNotifications] Failed to fetch:", json.error);
        setItems([]);
        setUnread(0);
      }
    } catch (error) {
      console.error("[useNotifications] Error fetching notifications:", error);
      setItems([]);
      setUnread(0);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  React.useEffect(() => {
    let isMounted = true;
    let channel: any = null;
    
    // Initial load
    refresh();
    
    // Set up real-time subscription for notifications
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
        .channel("admin-notifications-realtime")
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
              refresh();
            }
          }
        )
        .subscribe();
    };
    
    setupRealtime();
    
    // Fallback polling every 30 seconds (reduced from 10s since we have realtime)
    const interval = setInterval(() => {
      if (isMounted) refresh();
    }, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
      if (channel) {
        const supabase = createSupabaseClient();
        supabase.removeChannel(channel);
      }
    };
  }, [refresh]);

  const markOne = React.useCallback(async (id: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, is_read: true }),
      });
      
      if (res.ok) {
        // Update local state immediately
        setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnread(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("[useNotifications] Failed to mark as read:", error);
    }
  }, []);

  const markAll = React.useCallback(async () => {
    try {
      // Get all unread IDs
      const unreadIds = items.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length === 0) return;
      
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids: unreadIds, is_read: true }),
      });
      
      if (res.ok) {
        // Update local state immediately
        setItems(prev => prev.map(n => ({ ...n, read: true })));
        setUnread(0);
      }
    } catch (error) {
      console.error("[useNotifications] Failed to mark all as read:", error);
    }
  }, [items]);

  return { 
    tab, 
    items, 
    unreadCount, 
    loading,
    setTab, 
    markOne, 
    markAll,
  };
}
