import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type ReportCategory =
  | 'Comportamiento inapropiado'
  | 'Spam o publicidad'
  | 'Contenido ofensivo'
  | 'Acoso o bullying'
  | 'Otro';

export type ReportStatus = 'pendiente' | 'resuelto';

export interface UserReport {
  id: string;
  reportedUserName: string;
  parcheName: string;
  category: ReportCategory;
  description: string;
  date: string; // ISO string
  status: ReportStatus;
}

const MOCK_REPORTS: UserReport[] = [
  {
    id: 'r1',
    reportedUserName: 'Carlos Ruiz',
    parcheName: 'Cálculo III',
    category: 'Acoso o bullying',
    description: 'Envía mensajes insistentes fuera del tema del parche a varias personas del grupo.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    status: 'pendiente',
  },
  {
    id: 'r2',
    reportedUserName: 'Andrés C.',
    parcheName: 'Gamers ECI',
    category: 'Spam o publicidad',
    description: 'Comparte enlaces a su canal de Twitch repetidamente en el chat.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    status: 'pendiente',
  },
  {
    id: 'r3',
    reportedUserName: 'María González',
    parcheName: 'Arte y Cultura',
    category: 'Contenido ofensivo',
    description: 'Subió una imagen inapropiada al lienzo colaborativo del parche.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    status: 'resuelto',
  },
  {
    id: 'r4',
    reportedUserName: 'Santiago Méndez',
    parcheName: 'Música y Producción',
    category: 'Comportamiento inapropiado',
    description: 'Discusiones agresivas recurrentes durante las sesiones de voz.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    status: 'pendiente',
  },
];

interface ReportsContextValue {
  reports: UserReport[];
  addReport: (report: Omit<UserReport, 'id' | 'date' | 'status'>) => void;
  resolveReport: (id: string) => void;
}

const ReportsContext = createContext<ReportsContextValue>({
  reports: [],
  addReport: () => {},
  resolveReport: () => {},
});

export function ReportsProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<UserReport[]>(MOCK_REPORTS);

  const addReport = useCallback((report: Omit<UserReport, 'id' | 'date' | 'status'>) => {
    setReports(prev => [
      { ...report, id: Math.random().toString(36).slice(2), date: new Date().toISOString(), status: 'pendiente' },
      ...prev,
    ]);
  }, []);

  const resolveReport = useCallback((id: string) => {
    setReports(prev => prev.map(r => (r.id === id ? { ...r, status: 'resuelto' } : r)));
  }, []);

  return (
    <ReportsContext.Provider value={{ reports, addReport, resolveReport }}>
      {children}
    </ReportsContext.Provider>
  );
}

export function useReports() {
  return useContext(ReportsContext);
}
