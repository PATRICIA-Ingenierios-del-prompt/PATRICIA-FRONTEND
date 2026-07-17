import { apiClient } from './apiClient';
import type { UUID } from '../types/patricia';

export interface NotificationResponse {
  id: UUID;
  scope: 'TARGETED' | 'GLOBAL';
  type: 'NEW_PUBLIC_PARCHE' | 'NEW_EVENT_FOR_PUBLIC' | 'NEW_EVENT_IN_PARCHE' | 'NEW_MESSAGE_ON_PARCHE' | 'NEW_MATCH_CONFIRMED' | 'ALBUM_MONA_UNLOCKED';
  message: string;
  payload: Record<string, string> | null;
  state: 'READ' | 'UNREAD';
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}

export interface RegisterDeviceRequest {
  token: string;
  platform: 'ANDROID' | 'IOS' | 'WEB';
}

const BASE = '/api/notifications';

export const notificationService = {
  async getNotifications(limit = 50): Promise<NotificationResponse[]> {
    const { data } = await apiClient.get<NotificationResponse[]>(BASE, {
      params: { limit },
    });
    return data;
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await apiClient.get<UnreadCountResponse>(BASE + '/unread-count');
    return data.count;
  },

  async markAsRead(notificationId: UUID): Promise<void> {
    await apiClient.post(`${BASE}/${notificationId}/read`);
  },

  async markAllRead(): Promise<void> {
    await apiClient.post(BASE + '/read-all');
  },

  async registerDevice(request: RegisterDeviceRequest): Promise<void> {
    await apiClient.post(BASE + '/devices', request);
  },

  async unregisterDevice(token: string): Promise<void> {
    await apiClient.delete(`${BASE}/devices/${encodeURIComponent(token)}`);
  },
};
