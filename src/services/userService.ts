import { apiClient } from './apiClient';

export interface PerfilResponse {
  id?: string;
  usuarioId?: string;
  bio?: string;
  carrera?: string;
  semestre?: number | string;
  intereses?: string[];
  nombre?: string;
  apellidos?: string;
  email?: string;
  foto?: string;
  genero?: string;
}

export interface ActualizarPerfilPayload {
  bio?: string;
  carrera?: string;
  semestre?: number | string;
  intereses?: string[];
  disponibilidad?: unknown;
}

const BASE = '/api/v1/usuarios';

export const userService = {
  async getPerfil(userId: string): Promise<PerfilResponse> {
    const { data } = await apiClient.get<PerfilResponse>(BASE + '/' + userId + '/perfil');
    return data;
  },
  async updatePerfil(userId: string, payload: ActualizarPerfilPayload): Promise<PerfilResponse> {
    const { data } = await apiClient.put<PerfilResponse>(BASE + '/' + userId + '/perfil', payload);
    return data;
  },
  async getIntereses(userId: string): Promise<string[]> {
    const { data } = await apiClient.get<string[]>(BASE + '/' + userId + '/intereses');
    return data;
  },
  async updateIntereses(userId: string, intereses: string[]): Promise<string[]> {
    const { data } = await apiClient.put<string[]>(BASE + '/' + userId + '/intereses', { intereses });
    return data;
  },
};
