// Inbox/Notifications using database API

export type InboxItem = {
  id: string;
  createdAt: string;
  unread: boolean;
  dept: string;
  purpose: string;
  requester?: string | null;
  vehicle?: string | null;
  date: string;
  status: "Pending";
};

const KEY = "travilink_requests_inbox";

function loadCache(): InboxItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as InboxItem[]) : [];
  } catch {
    return [];
  }
}

function saveCache(items: InboxItem[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
  }
}

export async function inboxCount(): Promise<number> {
  try {
    // Get unread notifications count
    const response = await fetch('/api/notifications?unread=true&limit=100');
    const result = await response.json();
    
    if (result.ok && result.data) {
      return result.data.length;
    }
  } catch (error) {
    console.error('[Inbox] Count failed:', error);
  }
  
  // Fallback to cache
  return loadCache().filter((i) => i.unread).length;
}

export async function addToInbox(item: Omit<InboxItem, "id" | "createdAt" | "unread" | "status"> & { id?: string, userId?: string }) {
  const id = item.id ?? `RQ-${Date.now()}`;
  
  try {
    // Create notification in database
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: item.userId,
        notification_type: 'new_request',
        title: 'New Request',
        message: `New request from ${item.dept}: ${item.purpose}`,
        related_type: 'request',
        related_id: id,
        priority: 'normal',
      }),
    });
  } catch (error) {
    console.error('[Inbox] Add notification failed:', error);
  }
  
  // Also update local cache
  const items = loadCache();
  items.unshift({ ...item, id, createdAt: new Date().toISOString(), unread: true, status: "Pending" });
  saveCache(items);
  
  return id;
}

export async function peekAll(): Promise<InboxItem[]> {
  try {
    // Fetch from API
    const response = await fetch('/api/notifications?limit=50');
    const result = await response.json();
    
    if (result.ok && result.data) {
      // Transform to InboxItem format
      const items: InboxItem[] = result.data.map((n: any) => ({
        id: n.related_id || n.id,
        createdAt: n.created_at,
        unread: !n.is_read,
        dept: 'N/A',
        purpose: n.message,
        requester: null,
        vehicle: null,
        date: n.created_at.split('T')[0],
        status: "Pending" as const,
      }));
      
      saveCache(items);
      return items;
    }
  } catch (error) {
    console.error('[Inbox] Fetch failed:', error);
  }
  
  // Fallback to cache
  return loadCache();
}

export async function takeAll(): Promise<InboxItem[]> {
  return peekAll();
}

export async function markRead(ids: string[]): Promise<void> {
  if (!ids.length) return;
  
  try {
    // Mark as read in API
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids,
        is_read: true,
      }),
    });
  } catch (error) {
    console.error('[Inbox] Mark read failed:', error);
  }
  
  // Update cache
  const items = loadCache().map(i => (ids.includes(i.id) ? { ...i, unread: false } : i));
  saveCache(items);
}

export async function clearInbox(): Promise<void> {
  try {
    // This would delete all read notifications
    // Implementation depends on your needs
  } catch (error) {
    console.error('[Inbox] Clear failed:', error);
  }
  
  saveCache([]);
}
