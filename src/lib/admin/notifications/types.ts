// src/lib/admin/notifications/types.ts
export type NotifKind = "comment" | "tag" | "system" | "mention" | "update";

export type Notification = {
  id: string;
  kind: NotifKind;
  title: string;
  body?: string;
  createdAt: string; // ISO
  read: boolean;
  actorName?: string;
  actorAvatarUrl?: string | null;
  href?: string; // deep link
  meta?: Record<string, unknown>;
};
