import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { adminService } from '../services/adminService';
import type { SupportTicketResponse, UUID } from '../types/patricia';

export type SupportStatus = 'pendiente' | 'resuelto';

export interface SupportMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  date: string; // ISO string
  status: SupportStatus;
}

function mapTicket(t: SupportTicketResponse): SupportMessage {
  return {
    id: t.id,
    name: t.name,
    email: t.email,
    message: t.message,
    date: t.createdAt,
    status: t.status === 'RESOLVED' ? 'resuelto' : 'pendiente',
  };
}

interface SupportContextValue {
  messages: SupportMessage[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addMessage: (msg: { name: string; email: string; message: string }) => Promise<void>;
  resolveMessage: (id: string) => Promise<void>;
}

const SupportContext = createContext<SupportContextValue>({
  messages: [],
  loading: false,
  error: null,
  refresh: async () => {},
  addMessage: async () => {},
  resolveMessage: async () => {},
});

export function SupportProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tickets = await adminService.getSupportTickets();
      setMessages(tickets.map(mapTicket));
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Error cargando soporte');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addMessage = useCallback(async (msg: { name: string; email: string; message: string }) => {
    await adminService.createSupportTicket(msg);
    await refresh();
  }, [refresh]);

  const resolveMessage = useCallback(async (id: string) => {
    await adminService.resolveSupportTicket(id as UUID);
    setMessages(prev => prev.map(m => (m.id === id ? { ...m, status: 'resuelto' } : m)));
  }, []);

  return (
    <SupportContext.Provider value={{ messages, loading, error, refresh, addMessage, resolveMessage }}>
      {children}
    </SupportContext.Provider>
  );
}

export function useSupport() {
  return useContext(SupportContext);
}
