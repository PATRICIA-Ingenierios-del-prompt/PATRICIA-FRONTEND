/**
 * llmApi.ts
 * Servicio para comunicarse con el Wellbeing MS (LLM Backend, Spring Boot + Groq).
 *
 * Rutas: /api/bienestar/** — via apiClient (no fetch crudo): el Gateway exige
 * el Bearer JWT en todo /api/* y apiClient lo inyecta + maneja el refresh.
 * El Gateway rutea /api/bienestar/** al MS de wellbeing (RouteConfig).
 */
import { apiClient } from './apiClient';

const BASE = '/api/bienestar';

/**
 * Envía un mensaje al chatbot y devuelve la respuesta del LLM.
 * @param message  Mensaje del usuario
 * @returns        Respuesta de texto del LLM
 */
export async function sendChatMessage(message: string): Promise<string> {
  const { data } = await apiClient.post<{ response: string }>(`${BASE}/chat`, { message });
  return data.response;
}

/**
 * Envía una entrada del diario emocional y devuelve el consejo del LLM.
 * @param mood     Estado de ánimo (ej. "Feliz", "Estresado")
 * @param content  Contenido escrito en el diario
 * @returns        Consejo generado por el LLM
 */
export async function sendDiaryEntry(mood: string, content: string): Promise<string> {
  const { data } = await apiClient.post<{ response: string }>(`${BASE}/diary`, { mood, content });
  return data.response;
}

/**
 * Verifica si el backend está disponible.
 * @returns true si el backend responde, false si no.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await apiClient.get(`${BASE}/health`, { timeout: 3000 });
    return res.status >= 200 && res.status < 300;
  } catch {
    return false;
  }
}
