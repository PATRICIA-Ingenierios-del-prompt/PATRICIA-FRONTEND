import { CreateBoardResponse, BoardResponse } from '../types/board';

const API_BASE_URL = '/api/boards';

export const boardApi = {
  createBoard: async (customId?: string): Promise<CreateBoardResponse> => {
    const url = customId ? `${API_BASE_URL}?customId=${customId}` : API_BASE_URL;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Failed to create board: ${response.statusText}`);
    }
    return response.json();
  },

  getBoard: async (boardId: string): Promise<BoardResponse> => {
    const response = await fetch(`${API_BASE_URL}/${boardId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch board: ${response.statusText}`);
    }
    return response.json();
  },

  clearBoard: async (boardId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/${boardId}/clear`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`Failed to clear board: ${response.statusText}`);
    }
  },
};
