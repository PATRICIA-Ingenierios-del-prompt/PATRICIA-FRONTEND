import { apiClient } from './apiClient';

export interface LogroResponse {
  codigo: string;
  nombre: string;
  descripcion: string;
  xp: number;
  desbloqueado: boolean;
  fechaDesbloqueo: string | null;
}

export interface LogrosResponse {
  usuarioId: string;
  xpTotal: number;
  logros: LogroResponse[];
}

const BASE = '/api/v1/usuarios';

export const logrosService = {
  async getLogros(userId: string): Promise<LogrosResponse> {
    const { data } = await apiClient.get<LogrosResponse>(BASE + '/' + userId + '/logros');
    return data;
  },
};
