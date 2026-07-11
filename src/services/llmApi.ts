/**
 * llmApi.ts
 * Servicio para comunicarse con el LLM Backend (Spring Boot + Groq).
 * Base URL: /api  →  proxy Vite  →  http://localhost:8086/api (LLM-Backend)
 */

const BASE_URL = '/api';

/**
 * Envía un mensaje al chatbot y devuelve la respuesta del LLM.
 * @param message  Mensaje del usuario
 * @returns        Respuesta de texto del LLM
 */
export async function sendChatMessage(message: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Error ${res.status} al contactar el servidor.`);
  }

  const data = await res.json();
  return data.response as string;
}

/**
 * Envía una entrada del diario emocional y devuelve el consejo del LLM.
 * @param mood     Estado de ánimo (ej. "Feliz", "Estresado")
 * @param content  Contenido escrito en el diario
 * @returns        Consejo generado por el LLM
 */
export async function sendDiaryEntry(mood: string, content: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/diary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mood, content }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Error ${res.status} al contactar el servidor.`);
  }

  const data = await res.json();
  return data.response as string;
}

/**
 * Verifica si el backend está disponible.
 * @returns true si el backend responde, false si no.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}
