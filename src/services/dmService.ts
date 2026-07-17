import { apiClient } from './apiClient';

/**
 * Chat privado 1 a 1. El backend de Comunicación no crea un sistema de
 * mensajería aparte: `ensureChannel` devuelve un channelId (siempre el mismo
 * para el mismo par de usuarios) que de ahí en adelante se usa exactamente
 * igual que un parcheId en el resto de la API de chat — WebSocket
 * (comunicacionSocket) e historial (`/api/chat/{channelId}/messages`).
 */
export const dmService = {
  /** Obtiene (o crea) el canal de chat privado con otro usuario. */
  async ensureChannel(otherUserId: string): Promise<string> {
    const { data } = await apiClient.post<{ channelId: string }>(`/api/dm/${otherUserId}`);
    return data.channelId;
  },
};
