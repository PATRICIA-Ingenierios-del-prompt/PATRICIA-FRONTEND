import { createContext, useContext, useState, useEffect, useCallback, type ReactNode, useMemo, useRef } from 'react';
import { notificationService, type NotificationResponse } from '../services/notificationService';
import { tokenManager } from '../services/tokenManager';

export type LocalNotificationType = 'match' | 'chat' | 'evento' | 'parche' | 'logro' | 'info';

export interface NotificationItem {
  id: string;
  serverId?: string;
  scope?: 'TARGETED' | 'GLOBAL';
  type: LocalNotificationType;
  text: string;
  time: string;
  read: boolean;
  payload?: {
    chatUserId?: string;
    parcheId?: string;
    eventId?: string;
    matchUserId?: string;
  };
}

interface NotificationsContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  pendingMatchCount: number;
  loading: boolean;
  addNotification: (n: Omit<NotificationItem, 'id' | 'time' | 'read'> & { id?: string; read?: boolean }) => string;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => void;
  setPendingMatchCount: (count: number) => void;
  refresh: () => Promise<void>;
}

const STORAGE_KEY = 'ulink-notifications-v1';
const POLL_INTERVAL_MS = 10_000;

function mapServerType(serverType: string): LocalNotificationType {
  switch (serverType) {
    case 'NEW_MATCH_CONFIRMED':
      return 'match';
    case 'NEW_MESSAGE_ON_PARCHE':
      return 'chat';
    case 'NEW_PUBLIC_PARCHE':
      return 'parche';
    case 'NEW_EVENT_FOR_PUBLIC':
    case 'NEW_EVENT_IN_PARCHE':
      return 'evento';
    case 'ALBUM_MONA_UNLOCKED':
      return 'logro';
    default:
      return 'info';
  }
}

function serverToItem(n: NotificationResponse): NotificationItem {
  const payload: NotificationItem['payload'] = {};
  if (n.payload) {
    if (n.payload.chatId) payload.chatUserId = n.payload.chatId;
    if (n.payload.parcheId) payload.parcheId = n.payload.parcheId;
    if (n.payload.otroUsuarioId) payload.matchUserId = n.payload.otroUsuarioId;
    if (n.payload.matchId) payload.matchUserId = n.payload.matchId;
    if (n.payload.eventId) payload.eventId = n.payload.eventId;
  }

  return {
    id: `server-${n.id}`,
    serverId: n.id,
    scope: n.scope,
    type: mapServerType(n.type),
    text: n.message,
    time: n.createdAt,
    read: n.state === 'READ',
    payload,
  };
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (!raw) return [];
      const parsed = JSON.parse(raw) as NotificationItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [pendingMatchCount, setPendingMatchCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const pollingRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    // Notifications are user-scoped; skip polling while logged out so we don't
    // fire authenticated requests (and 401s) on the landing page.
    if (!tokenManager.getAccessToken()) return;
    setLoading(true);
    try {
      const server = await notificationService.getNotifications();
      setNotifications(prev => {
        const serverItems = server.map(serverToItem);
        const localOnly = prev.filter(p => !p.serverId && !serverItems.some(s => s.id === p.id));
        const serverIds = new Set(serverItems.map(s => s.id));
        const dedupedServer = prev.filter(p => p.serverId && !serverIds.has(p.id));
        return [...dedupedServer, ...serverItems, ...localOnly].sort(
          (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
        );
      });
    } catch (e) {
      // Leave local notifications in place if the backend is unavailable.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    pollingRef.current = window.setInterval(() => refresh(), POLL_INTERVAL_MS);

    return () => {
      window.removeEventListener('focus', onFocus);
      if (pollingRef.current) window.clearInterval(pollingRef.current);
    };
  }, [refresh]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // ignore storage errors (e.g. private mode)
    }
  }, [notifications]);

  const addNotification = useCallback((n: Omit<NotificationItem, 'id' | 'time' | 'read'> & { id?: string; read?: boolean }) => {
    const id = n.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const item: NotificationItem = { ...n, id, time: new Date().toISOString(), read: n.read ?? false };
    setNotifications(prev => {
      const idx = prev.findIndex(x => x.id === id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = item;
        return next;
      }
      return [item, ...prev];
    });
    return id;
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    const item = notifications.find(n => n.id === id);
    if (item?.serverId) {
      try {
        await notificationService.markAsRead(item.serverId);
      } catch {
        // still update local state so the UI is not blocked
      }
    }
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  }, [notifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllRead();
    } catch {
      // ignore
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      pendingMatchCount,
      loading,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      setPendingMatchCount,
      refresh,
    }),
    [notifications, unreadCount, pendingMatchCount, loading, addNotification, markAsRead, markAllAsRead, removeNotification, refresh]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider');
  return ctx;
}
