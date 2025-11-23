"use client";

import { useMemo, useState, useEffect } from "react";
import NotificationsView, {
  NotificationItem,
  NotificationsTab,
} from "@/components/user/notification/NotificationsView";
import { formatLongDateTime } from "@/lib/datetime";
import { createSupabaseClient } from "@/lib/supabase/client";

export default function UserNotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<NotificationsTab>("unread");

  useEffect(() => {
    let isMounted = true;
    let channel: any = null;
    
    // Initial load
    fetchNotifications();
    
    // Set up real-time subscription
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
        .channel("user-notifications-page-changes")
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
              fetchNotifications();
            }
          }
        )
        .subscribe();
    };
    
    setupRealtime();
    
    // Fallback polling every 30 seconds
    const interval = setInterval(() => {
      if (isMounted) {
        fetchNotifications();
      }
    }, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
      if (channel) {
        const supabase = createSupabaseClient();
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications?limit=50');
      const data = await response.json();
      
      if (data.ok) {
        // Transform API data to NotificationItem format
        const transformed: NotificationItem[] = (data.data || []).map((notif: any) => ({
          id: notif.id,
          text: notif.message || notif.title,
          time: formatTimeAgo(notif.created_at),
          read: notif.is_read || false,
          type: notif.notification_type,
          actionUrl: notif.action_url,
          actionLabel: notif.action_label
        }));
        setItems(transformed);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatLongDateTime(dateString);
  };

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items]
  );
  const allCount = items.length;

  async function onMarkAllRead() {
    if (unreadCount === 0) return;
    
    const unreadIds = items.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: unreadIds, is_read: true })
      });

      const data = await response.json();
      if (data.ok) {
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }

  function onRefresh() {
    fetchNotifications();
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
