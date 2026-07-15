import { apiClient } from './apiClient';

export interface PerfilResponse {
  id?: string;
  usuarioId?: string;
  bio?: string;
  carrera?: string;
  segundaCarrera?: string;
  semestre?: number | string;
  intereses?: string[];
  nombre?: string;
  apellidos?: string;
  email?: string;
  /**
   * Nombre real del campo en el backend (ver PerfilResponse.java en
   * Users). Se normaliza a `foto` en getPerfil() de abajo para no romper
   * el resto de la app, que ya lee `perfil.foto`.
   */
  urlFotoPerfil?: string;
  foto?: string;
  genero?: string;
  fechaNacimiento?: string;
  onboardingCompleto?: boolean;
}

export interface ActualizarPerfilPayload {
  bio?: string;
  carrera?: string;
  segundaCarrera?: string;
  semestre?: number | string;
  intereses?: string[];
  disponibilidad?: unknown;
  foto?: string;
}

/** Payload completo del onboarding — enviado una sola vez al completar el registro */
export interface OnboardingPayload {
  nombre: string;
  apellidos: string;
  carrera: string;
  segundaCarrera?: string;
  semestre: number;
  fechaNacimiento?: string;   // ISO date  "YYYY-MM-DD"
  genero?: string;
  foto?: string;              // base64 data-URL  (opcional)
  intereses: string[];        // array de IDs del InteresesPicker
}

const BASE = '/api/v1/usuarios';

export const userService = {
  async getPerfil(userId: string): Promise<PerfilResponse> {
    const { data } = await apiClient.get<PerfilResponse>(BASE + '/' + userId + '/perfil');
    // El backend devuelve `urlFotoPerfil`, no `foto` — se normaliza aquí una
    // sola vez para que el resto de la app pueda seguir leyendo `perfil.foto`.
    return { ...data, foto: data.foto ?? data.urlFotoPerfil };
  },
  /**
   * Igual que getPerfil, pero para varios usuarios en paralelo — útil para
   * hidratar cards de Matching (que solo traen IDs, no datos de perfil).
   * Los que fallen (404, red) se omiten en vez de tumbar el resto del batch.
   */
  async getPerfiles(userIds: string[]): Promise<Record<string, PerfilResponse>> {
    const resultados = await Promise.allSettled(userIds.map(id => userService.getPerfil(id)));
    const porId: Record<string, PerfilResponse> = {};
    resultados.forEach((r, i) => {
      if (r.status === 'fulfilled') porId[userIds[i]] = r.value;
    });
    return porId;
  },
  async updatePerfil(userId: string, payload: ActualizarPerfilPayload): Promise<PerfilResponse> {
    const { data } = await apiClient.put<PerfilResponse>(BASE + '/' + userId + '/perfil', payload);
    return { ...data, foto: data.foto ?? data.urlFotoPerfil };
  },
  async getIntereses(userId: string): Promise<string[]> {
    const { data } = await apiClient.get<string[]>(BASE + '/' + userId + '/intereses');
    return data;
  },
  async updateIntereses(userId: string, intereses: string[]): Promise<string[]> {
    const { data } = await apiClient.put<string[]>(BASE + '/' + userId + '/intereses', { intereses });
    return data;
  },

  /**
   * Completa el onboarding de un usuario nuevo.
   * PUT /api/v1/usuarios/{id}/perfil  con todos los datos del formulario.
   * El backend debe marcar onboardingCompleto = true al recibir este payload.
   */
  async completarOnboarding(userId: string, payload: OnboardingPayload): Promise<PerfilResponse> {
    const { data } = await apiClient.put<PerfilResponse>(
      BASE + '/' + userId + '/perfil',
      { ...payload, onboardingCompleto: true },
    );
    return data;
  },

  /**
   * Verifica si el usuario ya completó el onboarding.
   * Se basa en el flag `onboardingCompleto` que el backend guarda al recibir
   * completarOnboarding() — no en heurísticas locales, porque `intereses` no
   * viene incluido en la respuesta de GET /perfil (vive en su propio endpoint)
   * y evaluarlo aquí forzaba a cualquier usuario ya registrado de vuelta al
   * onboarding, cuyo reenvío chocaba con un 409 porque el perfil ya existía.
   * Devuelve true si el perfil no existe (404) o si el flag es false.
   */
  async necesitaOnboarding(userId: string): Promise<boolean> {
    try {
      const perfil = await userService.getPerfil(userId);
      return !perfil.onboardingCompleto;
    } catch (err: any) {
      // 404 → usuario nuevo, necesita onboarding
      if (err?.response?.status === 404) return true;
      // Otro error de red → asumimos que no necesita (evitar bloquear el login)
      return false;
    }
  },

  /** Solicita el cierre permanente de la cuenta (el backend aplica 24h de gracia antes de borrar). */
  async solicitarEliminacionCuenta(userId: string): Promise<void> {
    await apiClient.delete(BASE + '/' + userId + '/cuenta');
  },
  /** Cancela una solicitud de cierre de cuenta pendiente (dentro de las 24h de gracia). */
  async cancelarEliminacionCuenta(userId: string): Promise<void> {
    await apiClient.delete(BASE + '/' + userId + '/cuenta/cancelar');
  },
  /** Consulta si la cuenta tiene una eliminación pendiente, y desde cuándo. */
  async getEstadoCuenta(userId: string): Promise<{ pendienteEliminacion: boolean; fechaSolicitudEliminacion: string | null }> {
    const { data } = await apiClient.get(BASE + '/' + userId + '/cuenta/estado');
    return data;
  },
};
