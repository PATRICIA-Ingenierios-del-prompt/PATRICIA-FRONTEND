import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type SupportStatus = 'pendiente' | 'resuelto';

export interface SupportMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  date: string; // ISO string
  status: SupportStatus;
}

const MOCK_MESSAGES: SupportMessage[] = [
  {
    id: 'sup1',
    name: 'Daniela Ospina',
    email: 'daniela.ospina@mail.escuelaing.edu.co',
    message: 'No me llega el código de verificación al correo, ¿qué puedo hacer?',
    date: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
    status: 'pendiente',
  },
  {
    id: 'sup2',
    name: 'Felipe Martínez',
    email: 'felipe.martinez@mail.escuelaing.edu.co',
    message: '¿Cómo cambio mi carrera en el perfil? No encuentro la opción.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    status: 'resuelto',
  },
];

interface SupportContextValue {
  messages: SupportMessage[];
  addMessage: (msg: Omit<SupportMessage, 'id' | 'date' | 'status'>) => void;
  resolveMessage: (id: string) => void;
}

const SupportContext = createContext<SupportContextValue>({
  messages: [],
  addMessage: () => {},
  resolveMessage: () => {},
});

export function SupportProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<SupportMessage[]>(MOCK_MESSAGES);

  const addMessage = useCallback((msg: Omit<SupportMessage, 'id' | 'date' | 'status'>) => {
    setMessages(prev => [
      { ...msg, id: Math.random().toString(36).slice(2), date: new Date().toISOString(), status: 'pendiente' },
      ...prev,
    ]);
  }, []);

  const resolveMessage = useCallback((id: string) => {
    setMessages(prev => prev.map(m => (m.id === id ? { ...m, status: 'resuelto' } : m)));
  }, []);

  return (
    <SupportContext.Provider value={{ messages, addMessage, resolveMessage }}>
      {children}
    </SupportContext.Provider>
  );
}

export function useSupport() {
  return useContext(SupportContext);
}
