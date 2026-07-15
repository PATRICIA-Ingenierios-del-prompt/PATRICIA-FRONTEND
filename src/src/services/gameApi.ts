import { BackendGameState } from '../types/game';

const API = '/api/games';

async function parseError(res: Response): Promise<Error> {
  try {
    const body = await res.json();
    return new Error(body.error || res.statusText);
  } catch {
    return new Error(res.statusText);
  }
}

export const gameApi = {
  getGame: async (gameId: string): Promise<BackendGameState> => {
    const res = await fetch(`${API}/${gameId}`);
    if (!res.ok) throw await parseError(res);
    return res.json();
  },
};
