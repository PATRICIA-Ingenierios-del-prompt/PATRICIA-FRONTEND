/**
 * llmApi.ts
 * Servicio para comunicarse con el LLM Backend (Spring Boot + Groq).
 * Flujo: apiClient → Vite proxy (/api/chat) → Gateway (8080) valida JWT → LLM-Backend (8086)
 */

import { apiClient } from './apiClient';

/**
 * Envía un mensaje al chatbot y devuelve la respuesta del LLM.
 * @param message  Mensaje del usuario
 * @returns        Respuesta de texto del LLM
 */
export async function sendChatMessage(message: string): Promise<string> {
  const { data } = await apiClient.post<{ response: string }>('/api/chat', { message });
  return data.response;
}

/**
 * Envía una entrada del diario emocional y devuelve el consejo del LLM.
 * @param mood     Estado de ánimo (ej. "Feliz", "Estresado")
 * @param content  Contenido escrito en el diario
 * @returns        Consejo generado por el LLM
 */
export async function sendDiaryEntry(mood: string, content: string): Promise<string> {
  const { data } = await apiClient.post<{ response: string }>('/api/diary', { mood, content });
  return data.response;
}

/**
 * Verifica si el backend LLM está disponible a través del Gateway.
 * @returns true si el backend responde, false si no.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const { status } = await apiClient.get('/api/health', {
      signal: AbortSignal.timeout(3000),
    });
    return status === 200;
  } catch {
    return false;
  }
}
