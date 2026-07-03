import { CreateBoardResponse, BoardResponse } from '../types/board';

const API_BASE_URL = 'http://localhost:8086/api/boards';

export const boardApi = {
  createBoard: async (): Promise<CreateBoardResponse> => {
    const response = await fetch(API_BASE_URL, {
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
