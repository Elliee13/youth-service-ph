import { Badge } from "../ui/shadcn/badge";
import { Button } from "../ui/shadcn/button";
import type { NotificationRow } from "../../lib/notifications.api";

export type NotificationQueryState = "loading" | "error" | "empty" | "ready";

type Props = {
  notifications: NotificationRow[];
  queryState: NotificationQueryState;
  readingId: string | null;
  onRetry: () => void;
  onOpen: (notification: NotificationRow) => void;
  onMarkRead: (notification: NotificationRow) => void;
  emptyMessage?: string;
  compact?: boolean;
};

function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) {
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatNotificationTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function NotificationFeed({
  notifications,
  queryState,
  readingId,
  onRetry,
  onOpen,
  onMarkRead,
  emptyMessage = "You have no notifications yet.",
  compact = false,
}: Props) {
  if (queryState === "loading") {
    return (
      <div className="rounded-2xl border border-black/10 bg-[rgb(var(--card))] p-4 text-sm text-black/60">
        Loading notifications...
      </div>
    );
  }

  if (queryState === "error") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <div className="font-semibold">We couldn&apos;t load your notifications.</div>
        <div className="mt-1 text-red-700/90">Check your connection and try again.</div>
        <Button type="button" variant="outline" className="mt-3" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }

  if (queryState === "empty") {
    return (
      <div className="rounded-2xl border border-black/10 bg-[rgb(var(--card))] p-4 text-sm text-black/60">
        <div className="font-semibold text-black/80">You&apos;re all caught up.</div>
        <div className="mt-1">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={[
            "rounded-2xl border p-4 transition",
            notification.is_read
              ? "border-black/10 bg-black/[0.015]"
              : "border-[rgba(255,119,31,0.24)] bg-[rgba(255,119,31,0.08)] shadow-sm",
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {!notification.is_read ? (
                  <span className="inline-flex size-2 rounded-full bg-[rgb(var(--accent))]" />
                ) : null}
                <div
                  className={[
                    "text-sm",
                    notification.is_read ? "font-medium text-black/70" : "font-semibold text-black/90",
                    compact ? "line-clamp-1" : "",
                  ].join(" ")}
                >
                  {notification.title}
                </div>
                {!notification.is_read ? (
                  <Badge
                    variant="outline"
                    className="border-[rgba(255,119,31,0.3)] bg-[rgba(255,119,31,0.1)] text-[rgb(var(--accent))]"
                  >
                    New
                  </Badge>
                ) : null}
              </div>
              <div
                className={[
                  "mt-1 text-sm leading-6",
                  notification.is_read ? "text-black/55" : "text-black/70",
                  compact ? "line-clamp-2" : "line-clamp-3",
                ].join(" ")}
              >
                {notification.message}
              </div>
              <div className="mt-2 text-xs text-black/45" title={formatNotificationTimestamp(notification.created_at)}>
                {formatNotificationTime(notification.created_at)}
              </div>
            </div>
          </div>

          <div className={compact ? "mt-3 flex flex-wrap gap-2" : "mt-4 flex flex-wrap gap-2"}>
            {notification.link ? (
              <Button
                type="button"
                size="sm"
                className="accent-glow"
                disabled={readingId === notification.id}
                onClick={() => onOpen(notification)}
              >
                {readingId === notification.id ? "Opening..." : "Open"}
              </Button>
            ) : null}
            {!notification.is_read ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={readingId === notification.id}
                onClick={() => onMarkRead(notification)}
              >
                {readingId === notification.id ? "Saving..." : "Mark as read"}
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
