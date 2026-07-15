import { apiClient } from './apiClient';
import type {
  SugerenciaResponse,
  DecisionMatching,
  DecisionResponse,
  MatchResponse,
  UUID,
} from '../types/patricia';

/**
 * Cliente de matching-service, siempre vía el Gateway (JWT, igual que
 * userService). El Gateway debe rutear /matching/** hacia el servicio
 * de Matching (puerto 8086) — ver RouteConfig.java del Gateway.
 *
 * IMPORTANTE: estos endpoints NO devuelven datos de presentación (nombre,
 * foto, bio). Solo traen candidatoId/otroUsuarioId + scores. Para armar una
 * card hay que hidratar cada id con userService.getPerfil(id).
 */
const BASE = '/matching';

export const matchingService = {
  /** Feed de candidatos pre-calculados (RF05.1). */
  async obtenerSugerencias(limite = 20): Promise<SugerenciaResponse[]> {
    const { data } = await apiClient.get<SugerenciaResponse[]>(BASE + '/sugerencias', {
      params: { limite },
    });
    return data;
  },

  /**
   * Registra un LIKE o DESCARTE sobre un candidato. Se usa tanto para el
   * swipe del feed "Descubrir" como para aceptar/rechazar una solicitud
   * recibida (mismo endpoint en ambos casos — un LIKE mutuo confirma el
   * match de inmediato).
   */
  async decidir(candidatoId: UUID, decision: DecisionMatching): Promise<DecisionResponse> {
    const { data } = await apiClient.post<DecisionResponse>(BASE + '/decisiones', {
      candidatoId,
      decision,
    });
    return data;
  },

  /** Matches confirmados del usuario autenticado. */
  async listarMatches(): Promise<MatchResponse[]> {
    const { data } = await apiClient.get<MatchResponse[]>(BASE + '/matches');
    return data;
  },

  /** IDs de usuarios que le dieron LIKE al usuario autenticado. */
  async solicitudesRecibidas(): Promise<UUID[]> {
    const { data } = await apiClient.get<UUID[]>(BASE + '/solicitudes-recibidas');
    return data;
  },
};
