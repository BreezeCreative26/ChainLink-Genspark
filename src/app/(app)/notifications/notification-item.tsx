"use client";

import Link from "next/link";
import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { markNotificationReadAction } from "@/app/(app)/notifications/actions";

interface NotificationRow {
  id: string;
  title: string;
  body: string | null;
  link_path: string | null;
  read_at: string | null;
  created_at: string;
}

export function NotificationItem({ notification }: { notification: NotificationRow }) {
  const [, startTransition] = useTransition();
  const isUnread = !notification.read_at;

  function handleClick() {
    if (isUnread) {
      startTransition(() => {
        markNotificationReadAction(notification.id);
      });
    }
  }

  const content = (
    <div
      className={`flex items-start justify-between gap-3 rounded-md border border-border px-4 py-3 ${
        isUnread ? "bg-accent/40" : ""
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{notification.title}</p>
        {notification.body && (
          <p className="mt-0.5 text-sm text-muted-foreground">{notification.body}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {new Date(notification.created_at).toLocaleString("en-GB")}
        </p>
      </div>
      {isUnread && (
        <Badge variant="accent" className="shrink-0 text-[10px]">
          New
        </Badge>
      )}
    </div>
  );

  if (notification.link_path) {
    return (
      <Link href={notification.link_path} onClick={handleClick}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={handleClick} className="w-full text-left">
      {content}
    </button>
  );
}
