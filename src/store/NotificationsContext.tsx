import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export interface NotificationItem {
  id: string;
  type: 'match' | 'chat' | 'evento' | 'reporte' | 'xp' | 'logro' | 'info';
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
  addNotification: (n: Omit<NotificationItem, 'id' | 'time' | 'read'> & { id?: string; read?: boolean }) => string;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  setPendingMatchCount: (count: number) => void;
}

const STORAGE_KEY = 'ulink-notifications-v1';

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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // ignore storage errors (e.g. private mode)
    }
  }, [notifications]);

  const addNotification = useCallback((n: Omit<NotificationItem, 'id' | 'time' | 'read'> & { id?: string; read?: boolean }) => {
    const id = n.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const item: NotificationItem = { ...n, id, time: n.time ?? 'reciente', read: n.read ?? false };
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

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        pendingMatchCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        setPendingMatchCount,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider');
  return ctx;
}
