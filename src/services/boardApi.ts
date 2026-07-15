import { apiClient } from './apiClient';
import { CreateBoardResponse, BoardResponse } from '../types/board';

// Through apiClient (not raw fetch): the Gateway requires the Bearer JWT on
// every /api/* route, and apiClient injects it + handles refresh.
const BASE = '/api/boards';

export const boardApi = {
  createBoard: async (customId?: string): Promise<CreateBoardResponse> => {
    const { data } = await apiClient.post<CreateBoardResponse>(BASE, null, {
      params: customId ? { customId } : undefined,
    });
    return data;
  },

  getBoard: async (boardId: string): Promise<BoardResponse> => {
    const { data } = await apiClient.get<BoardResponse>(`${BASE}/${boardId}`);
    return data;
  },

  clearBoard: async (boardId: string): Promise<void> => {
    await apiClient.post(`${BASE}/${boardId}/clear`);
  },
};
