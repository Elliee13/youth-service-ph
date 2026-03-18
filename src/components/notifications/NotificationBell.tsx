import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/shadcn/dropdown-menu";
import { Button } from "../ui/shadcn/button";
import { withTimeout } from "../../lib/async";
import {
  countMyUnreadNotifications,
  listMyNotifications,
  markNotificationRead,
  type NotificationRow,
} from "../../lib/notifications.api";
import { useAuth } from "../../auth/useAuth";
import {
  NotificationFeed,
  type NotificationQueryState,
} from "./NotificationFeed";

const NOTIFICATIONS_CHANGED_EVENT = "ysp:notifications-changed";

export function NotificationBell() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const aliveRef = useRef(true);
  const [open, setOpen] = useState(false);
  const [queryState, setQueryState] = useState<NotificationQueryState>("loading");
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [readingId, setReadingId] = useState<string | null>(null);

  const notificationsRoute =
    profile?.role === "admin"
      ? "/admin/notifications"
      : profile?.role === "chapter_head"
        ? "/chapter-head/notifications"
        : "/notifications";

  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;
    const count = await withTimeout(
      countMyUnreadNotifications(),
      15000,
      "Notification count request timed out. Please try again."
    );
    if (!aliveRef.current) return;
    setUnreadCount(count);
  }, [user]);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    if (aliveRef.current) setQueryState("loading");
    try {
      const data = await withTimeout(
        listMyNotifications(6),
        15000,
        "Notification request timed out. Please try again."
      );
      if (!aliveRef.current) return;
      setNotifications(data);
      setQueryState(data.length === 0 ? "empty" : "ready");
    } catch {
      if (!aliveRef.current) return;
      setQueryState("error");
    }
  }, [user]);

  useEffect(() => {
    aliveRef.current = true;
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setQueryState("empty");
      return () => {
        aliveRef.current = false;
      };
    }

    refreshUnreadCount().catch(() => undefined);
    const handleNotificationsChanged = () => {
      refreshUnreadCount().catch(() => undefined);
    };
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, handleNotificationsChanged);
    const intervalId = window.setInterval(() => {
      refreshUnreadCount().catch(() => undefined);
    }, 30000);

    return () => {
      aliveRef.current = false;
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, handleNotificationsChanged);
      window.clearInterval(intervalId);
    };
  }, [refreshUnreadCount, user]);

  useEffect(() => {
    if (!open) return;
    refreshUnreadCount().catch(() => undefined);
    refreshNotifications().catch(() => undefined);
  }, [open, refreshNotifications, refreshUnreadCount]);

  async function handleOpenNotification(notification: NotificationRow) {
    try {
      if (!notification.is_read) {
        setReadingId(notification.id);
        await withTimeout(
          markNotificationRead(notification.id),
          15000,
          "Mark-as-read request timed out. Please try again."
        );
        if (!aliveRef.current) return;
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id
              ? { ...item, is_read: true, read_at: new Date().toISOString() }
              : item
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
      }
    } finally {
      if (aliveRef.current) setReadingId(null);
    }

    if (notification.link) {
      setOpen(false);
      navigate(notification.link);
    }
  }

  async function handleMarkRead(notification: NotificationRow) {
    if (notification.is_read) return;
    setReadingId(notification.id);
    try {
      await withTimeout(
        markNotificationRead(notification.id),
        15000,
        "Mark-as-read request timed out. Please try again."
      );
      if (!aliveRef.current) return;
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id
            ? { ...item, is_read: true, read_at: new Date().toISOString() }
            : item
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
    } finally {
      if (aliveRef.current) setReadingId(null);
    }
  }

  if (!user) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white/80 text-black/75 transition hover:bg-white hover:text-black"
          aria-label="Open notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[rgb(var(--accent))] px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="w-[min(92vw,26rem)] rounded-3xl border border-black/10 bg-white p-0"
      >
        <div className="border-b border-black/10 px-6 py-5 text-left">
          <div className="[font-family:var(--font-display)] text-2xl tracking-[-0.02em]">
            Notifications
          </div>
          <div className="text-sm text-black/60">
            Recent updates and announcements.
          </div>
        </div>

        <div className="max-h-[28rem] overflow-y-auto px-6 py-5">
          <NotificationFeed
            notifications={notifications}
            queryState={queryState}
            readingId={readingId}
            onRetry={() => void refreshNotifications()}
            onOpen={(notification) => void handleOpenNotification(notification)}
            onMarkRead={(notification) => void handleMarkRead(notification)}
            compact
          />
        </div>

        <DropdownMenuSeparator className="bg-black/10" />
        <div className="p-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              setOpen(false);
              navigate(notificationsRoute);
            }}
          >
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
