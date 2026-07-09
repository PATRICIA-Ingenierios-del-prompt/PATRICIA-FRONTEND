import { apiClient } from './apiClient';
import type {
  CreateEventLinkedToParcheRequest, CreateEventRequest, CreateEventResponse,
  CreateReportRequest, CreateReportResponse, EventCategory, EventMapResponse,
  EventResponse, Page, Pageable, PictureUploadRequest, PictureUploadResponse, UUID,
} from '../types/patricia';

const BASE = '/api/events';
const pageParams = (p?: Pageable) => ({ page: p?.page ?? 0, size: p?.size ?? 200 });

/** Events MS client. Identity comes from the gateway-injected X-User-Id. */
export const eventService = {
  /* mutations */
  async create(body: CreateEventRequest): Promise<CreateEventResponse> {
    const { data } = await apiClient.post<CreateEventResponse>(BASE, body);
    return data;
  },
  async createLinked(body: CreateEventLinkedToParcheRequest): Promise<CreateEventResponse> {
    const { data } = await apiClient.post<CreateEventResponse>(`${BASE}/linked`, body);
    return data;
  },
  async remove(eventId: UUID): Promise<void> {
    await apiClient.delete(`${BASE}/${eventId}`);
  },
  async join(eventId: UUID): Promise<void> {
    await apiClient.post(`${BASE}/${eventId}/join`);
  },
  async removeParticipant(eventId: UUID, userId: UUID): Promise<void> {
    await apiClient.delete(`${BASE}/${eventId}/participants/${userId}`);
  },

  /* queries */
  async get(eventId: UUID): Promise<EventResponse> {
    const { data } = await apiClient.get<EventResponse>(`${BASE}/${eventId}`);
    return data;
  },
  /** Public open events (fully-public + public-parche) — the shared map. */
  async publicMap(page?: Pageable): Promise<Page<EventMapResponse>> {
    const { data } = await apiClient.get<Page<EventMapResponse>>(`${BASE}/map`, { params: pageParams(page) });
    return data;
  },
  /** Open events of parches the caller belongs to (incl. private ones). */
  async myParchesEvents(page?: Pageable): Promise<Page<EventMapResponse>> {
    const { data } = await apiClient.get<Page<EventMapResponse>>(`${BASE}/me/parches/events`, { params: pageParams(page) });
    return data;
  },
  async byCategory(category: EventCategory, page?: Pageable): Promise<Page<EventMapResponse>> {
    const { data } = await apiClient.get<Page<EventMapResponse>>(`${BASE}/category`, { params: { category, ...pageParams(page) } });
    return data;
  },
  async byName(name: string, page?: Pageable): Promise<Page<EventMapResponse>> {
    const { data } = await apiClient.get<Page<EventMapResponse>>(`${BASE}/name`, { params: { name, ...pageParams(page) } });
    return data;
  },
  /** date = "yyyy-MM-dd" */
  async byDate(date: string, page?: Pageable): Promise<Page<EventMapResponse>> {
    const { data } = await apiClient.get<Page<EventMapResponse>>(`${BASE}/date`, { params: { date, ...pageParams(page) } });
    return data;
  },

  /* reports */
  async createReport(eventId: UUID, body: CreateReportRequest): Promise<CreateReportResponse> {
    const { data } = await apiClient.post<CreateReportResponse>(`${BASE}/${eventId}/reports`, body);
    return data;
  },

  /* picture upload */
  async requestPictureUpload(body: PictureUploadRequest): Promise<PictureUploadResponse> {
    const { data } = await apiClient.post<PictureUploadResponse>(`${BASE}/picture-upload-url`, body);
    return data;
  },
};
