// src/components/admin/notifications/ui/NotificationItem.ui.tsx
"use client";

import * as React from "react";
import type { Notification } from "@/lib/admin/notifications/types";
import { MessageSquareText, AtSign, Bell, UserPlus, Info } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";

function KindIcon({ kind }: { kind: Notification["kind"] }) {
  const common = "h-4 w-4";
  switch (kind) {
    case "comment":
      return <MessageSquareText className={common} />;
    case "mention":
      return <AtSign className={common} />;
    case "tag":
      return <UserPlus className={common} />;
    case "update":
      return <Info className={common} />;
    default:
      return <Bell className={common} />;
  }
}

type Props = {
  data: Notification;
  onRead?: (id: string) => void;
};

export default function NotificationItem({ data, onRead }: Props) {
  const Wrapper: any = data.href ? Link : "div";
  const wrapperProps = data.href ? { href: data.href } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={clsx(
        "group flex gap-3 rounded-lg p-2 transition hover:bg-neutral-50",
        !data.read && "bg-neutral-50"
      )}
      onClick={() => onRead?.(data.id)}
    >
      <div className="mt-0.5">
        {data.actorAvatarUrl ? (
          <img
            src={data.actorAvatarUrl}
            alt={data.actorName ?? "avatar"}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200">
            <KindIcon kind={data.kind} />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-sm">
          <span className="font-medium">{data.title}</span>
          {data.body && <span className="text-neutral-600"> — {data.body}</span>}
        </div>
        <div className="mt-0.5 text-xs text-neutral-500">
          {new Date(data.createdAt).toLocaleString()}
        </div>
      </div>

      {!data.read && (
        <span className="mt-2 h-2 w-2 rounded-full bg-[#7a0019]" aria-hidden />
      )}
    </Wrapper>
  );
}
