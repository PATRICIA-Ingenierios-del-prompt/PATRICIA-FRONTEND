import { apiClient } from './apiClient';
import type {
  CreateInviteRequest, CreateParcheRequest, CreateParcheResponse, InviteTokenResponse,
  Page, Pageable, ParcheCategory, ParcheResponse, ParcheSummaryResponse,
  PictureUploadRequest, PictureUploadResponse, UUID, Visibility,
} from '../types/patricia';

const BASE = '/api/parches';
const INVITES = '/api/invites';

const pageParams = (p?: Pageable) => ({ page: p?.page ?? 0, size: p?.size ?? 200 });

/**
 * Parches MS client. Identity (owner/requester) is taken by the backend from
 * the gateway-injected X-User-Id — never passed here (the JWT carries it).
 */
export const parcheService = {
  /* mutations */
  async create(body: CreateParcheRequest): Promise<CreateParcheResponse> {
    const { data } = await apiClient.post<CreateParcheResponse>(BASE, body);
    return data;
  },
  async remove(parcheId: UUID): Promise<void> {
    await apiClient.delete(`${BASE}/${parcheId}`);
  },
  async join(parcheId: UUID): Promise<void> {
    await apiClient.post(`${BASE}/${parcheId}/join`);
  },
  async removeMember(parcheId: UUID, memberId: UUID): Promise<void> {
    await apiClient.delete(`${BASE}/${parcheId}/members/${memberId}`);
  },

  /* queries */
  async get(parcheId: UUID): Promise<ParcheResponse> {
    const { data } = await apiClient.get<ParcheResponse>(`${BASE}/${parcheId}`);
    return data;
  },
  async getEvents(parcheId: UUID): Promise<UUID[]> {
    const { data } = await apiClient.get<UUID[]>(`${BASE}/${parcheId}/events`);
    return data;
  },
  async byCategory(category: ParcheCategory, page?: Pageable): Promise<Page<ParcheSummaryResponse>> {
    const { data } = await apiClient.get<Page<ParcheSummaryResponse>>(`${BASE}/category`, { params: { category, ...pageParams(page) } });
    return data;
  },
  async byVisibility(visibility: Visibility, page?: Pageable): Promise<Page<ParcheSummaryResponse>> {
    const { data } = await apiClient.get<Page<ParcheSummaryResponse>>(`${BASE}/visibility`, { params: { visibility, ...pageParams(page) } });
    return data;
  },
  async openSpots(page?: Pageable): Promise<Page<ParcheSummaryResponse>> {
    const { data } = await apiClient.get<Page<ParcheSummaryResponse>>(`${BASE}/capacity`, { params: pageParams(page) });
    return data;
  },
  async byName(name: string, page?: Pageable): Promise<Page<ParcheSummaryResponse>> {
    const { data } = await apiClient.get<Page<ParcheSummaryResponse>>(`${BASE}/name`, { params: { name, ...pageParams(page) } });
    return data;
  },
  /** Parches the authenticated user is a member of (public + private). */
  async mine(page?: Pageable): Promise<Page<ParcheSummaryResponse>> {
    const { data } = await apiClient.get<Page<ParcheSummaryResponse>>(`${BASE}/me`, { params: pageParams(page) });
    return data;
  },

  /** Member IDs of a parche (names live in Users MS — resolve via userService.getPerfiles). */
  async getMembers(parcheId: UUID): Promise<UUID[]> {
    const { data } = await apiClient.get<UUID[]>(`${BASE}/${parcheId}/members`);
    return data;
  },

  /* invites */
  async createInvite(body: CreateInviteRequest): Promise<InviteTokenResponse> {
    const { data } = await apiClient.post<InviteTokenResponse>(INVITES, body);
    return data;
  },
  async acceptInvite(token: string): Promise<void> {
    await apiClient.post(`${INVITES}/accept`, null, { params: { token } });
  },

  /* picture upload (presigned S3 POST) */
  async requestPictureUpload(body: PictureUploadRequest): Promise<PictureUploadResponse> {
    const { data } = await apiClient.post<PictureUploadResponse>(`${BASE}/picture-upload-url`, body);
    return data;
  },
};
