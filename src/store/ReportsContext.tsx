import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { adminService } from '../services/adminService';
import type { ParcheReportResponse, ParcheReportType, UUID } from '../types/patricia';

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

const TYPE_LABELS: Record<ParcheReportType, ReportCategory> = {
  SPAM: 'Spam o publicidad',
  BAD_BEHAVIOUR: 'Comportamiento inapropiado',
  BULLYING: 'Acoso o bullying',
  OFFENSIVE_CONTENT: 'Contenido ofensivo',
  OTHER: 'Otro',
};

function mapReport(r: ParcheReportResponse): UserReport {
  return {
    id: r.reportId,
    reportedUserName: r.reportedUserName || 'Usuario desconocido',
    parcheName: r.parcheName || 'Parche desconocido',
    category: TYPE_LABELS[r.reportType] || 'Otro',
    description: r.description,
    date: r.createdAt,
    status: r.status === 'RESOLVED' ? 'resuelto' : 'pendiente',
  };
}

interface ReportsContextValue {
  reports: UserReport[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addReport: (parcheId: UUID, reportedId: UUID, reportedUserName: string, parcheName: string, reportType: ParcheReportType, description: string) => Promise<void>;
  resolveReport: (id: string) => Promise<void>;
}

const ReportsContext = createContext<ReportsContextValue>({
  reports: [],
  loading: false,
  error: null,
  refresh: async () => {},
  addReport: async () => {},
  resolveReport: async () => {},
});

export function ReportsProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await adminService.getReports('PENDING', 0, 200);
      setReports(page.content.map(mapReport));
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Error cargando reportes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addReport = useCallback(async (
    parcheId: UUID,
    reportedId: UUID,
    reportedUserName: string,
    parcheName: string,
    reportType: ParcheReportType,
    description: string,
  ) => {
    await adminService.createReport(parcheId, {
      reportedId,
      reportType,
      description,
      reportedUserName,
      parcheName,
    });
    await refresh();
  }, [refresh]);

  const resolveReport = useCallback(async (id: string) => {
    await adminService.resolveReport(id);
    setReports(prev => prev.map(r => (r.id === id ? { ...r, status: 'resuelto' } : r)));
  }, []);

  return (
    <ReportsContext.Provider value={{ reports, loading, error, refresh, addReport, resolveReport }}>
      {children}
    </ReportsContext.Provider>
  );
}

export function useReports() {
  return useContext(ReportsContext);
}
