import { apiClient } from './apiClient';
import type { LiveLocationResponse, UpdateLocationRequest, UUID } from '../types/patricia';

const BASE = '/api/locations';

/** Location MS REST client. The live channel is the geo socket (see locationSocket). */
export const locationService = {
  /** Push one position for an event (202 Accepted) — REST fallback to the socket. */
  async update(eventId: UUID, body: UpdateLocationRequest): Promise<void> {
    await apiClient.post(`${BASE}/${eventId}`, body);
  },
  /** Current live positions for an event (ephemeral). */
  async liveSnapshot(eventId: UUID): Promise<LiveLocationResponse[]> {
    const { data } = await apiClient.get<LiveLocationResponse[]>(`${BASE}/${eventId}/live`);
    return data;
  },
};
