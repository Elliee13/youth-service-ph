import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { CmsShell } from "../components/cms/CmsShell";
import {
  NotificationFeed,
  type NotificationQueryState,
} from "../components/notifications/NotificationFeed";
import { Card } from "../components/ui/Card";
import { Container } from "../components/ui/Container";
import { Section } from "../components/ui/Section";
import { useAuth } from "../auth/useAuth";
import { withTimeout } from "../lib/async";
import {
  listMyNotifications,
  markNotificationRead,
  type NotificationRow,
} from "../lib/notifications.api";

type Surface = "public" | "staff";

type Props = {
  title: string;
  subtitle: string;
  surface: Surface;
};

const NOTIFICATIONS_CHANGED_EVENT = "ysp:notifications-changed";

export default function NotificationsPage({ title, subtitle, surface }: Props) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const aliveRef = useRef(true);
  const [queryState, setQueryState] = useState<NotificationQueryState>("loading");
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [readingId, setReadingId] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setQueryState("empty");
      return;
    }

    if (aliveRef.current) setQueryState("loading");

    try {
      const data = await withTimeout(
        listMyNotifications(100),
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
    loadNotifications().catch(() => undefined);
    return () => {
      aliveRef.current = false;
    };
  }, [loadNotifications]);

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
        window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
      }
    } finally {
      if (aliveRef.current) setReadingId(null);
    }

    if (notification.link) {
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
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
    } finally {
      if (aliveRef.current) setReadingId(null);
    }
  }

  if (surface === "public") {
    if (!user) {
      return (
        <Container>
          <div className="py-12 sm:py-16">
            <Card className="border-black/10 bg-white p-6 text-sm text-black/70">
              Sign in or create a volunteer account first to view notifications.{" "}
              <Link
                to="/register"
                className="font-semibold text-[rgb(var(--accent))] hover:underline"
              >
                Register now
              </Link>
              .
            </Card>
          </div>
        </Container>
      );
    }

    if (profile?.role === "admin") {
      return <Navigate to="/admin/notifications" replace />;
    }

    if (profile?.role === "chapter_head") {
      return <Navigate to="/chapter-head/notifications" replace />;
    }

    return (
      <Section eyebrow="Notifications" title={title} description={subtitle}>
        <NotificationFeed
          notifications={notifications}
          queryState={queryState}
          readingId={readingId}
          onRetry={() => void loadNotifications()}
          onOpen={(notification) => void handleOpenNotification(notification)}
          onMarkRead={(notification) => void handleMarkRead(notification)}
          emptyMessage="New applications, approvals, and announcements will appear here."
        />
      </Section>
    );
  }

  return (
    <CmsShell title={title} subtitle={subtitle}>
      <Card className="border-black/10 bg-white p-6 sm:p-8">
        <NotificationFeed
          notifications={notifications}
          queryState={queryState}
          readingId={readingId}
          onRetry={() => void loadNotifications()}
          onOpen={(notification) => void handleOpenNotification(notification)}
          onMarkRead={(notification) => void handleMarkRead(notification)}
          emptyMessage="Workflow updates and announcements will appear here as they arrive."
        />
      </Card>
    </CmsShell>
  );
}
