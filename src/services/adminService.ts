import { apiClient } from './apiClient';
import type {
  AdminDashboardResponse,
  AdminParcheStatsResponse,
  CreateParcheReportRequest,
  Page,
  ParcheReportResponse,
  SupportTicketResponse,
  UUID,
} from '../types/patricia';

const USER_ADMIN_BASE = '/api/v1/usuarios/admin';
const USER_SUPPORT_BASE = '/api/v1/usuarios/support';
const PARCHES_ADMIN_BASE = '/api/parches/admin';
const PARCHES_REPORTS_BASE = '/api/parches';

export const adminService = {
  async getDashboard(): Promise<AdminDashboardResponse> {
    const { data } = await apiClient.get<AdminDashboardResponse>(`${USER_ADMIN_BASE}/dashboard`);
    return data;
  },

  async getParcheStats(): Promise<AdminParcheStatsResponse> {
    const { data } = await apiClient.get<AdminParcheStatsResponse>(`${PARCHES_ADMIN_BASE}/stats`);
    return data;
  },

  async getReports(status?: 'PENDING' | 'RESOLVED', page = 0, size = 50): Promise<Page<ParcheReportResponse>> {
    const { data } = await apiClient.get<Page<ParcheReportResponse>>(`${PARCHES_ADMIN_BASE}/reports`, {
      params: { status, page, size },
    });
    return data;
  },

  async createReport(parcheId: UUID, body: CreateParcheReportRequest): Promise<ParcheReportResponse> {
    const { data } = await apiClient.post<ParcheReportResponse>(`${PARCHES_REPORTS_BASE}/${parcheId}/reports`, body);
    return data;
  },

  async resolveReport(reportId: UUID): Promise<ParcheReportResponse> {
    const { data } = await apiClient.post<ParcheReportResponse>(`${PARCHES_ADMIN_BASE}/reports/${reportId}/resolve`);
    return data;
  },

  async getSupportTickets(): Promise<SupportTicketResponse[]> {
    const { data } = await apiClient.get<SupportTicketResponse[]>(USER_SUPPORT_BASE);
    return data;
  },

  async createSupportTicket(body: { name?: string; email?: string; message: string }): Promise<SupportTicketResponse> {
    const { data } = await apiClient.post<SupportTicketResponse>(USER_SUPPORT_BASE, body);
    return data;
  },

  async resolveSupportTicket(id: UUID): Promise<SupportTicketResponse> {
    const { data } = await apiClient.post<SupportTicketResponse>(`${USER_SUPPORT_BASE}/${id}/resolve`);
    return data;
  },
};
