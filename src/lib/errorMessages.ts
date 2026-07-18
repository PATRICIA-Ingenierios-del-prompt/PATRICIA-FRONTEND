/**
 * Turns an Axios/HTTP error into a plain-Spanish message a non-technical
 * user can act on — never a raw backend string, HTTP status, or stack trace.
 *
 * Priority:
 *  1. If the backend returned { "error": "..." } in the body, use it directly
 *     (our backend already speaks Spanish from the domain exceptions).
 *  2. Fall back to the generic per-status message.
 *  3. If there's no response at all, show a connectivity message.
 *  4. If nothing matches, use the provided fallback.
 */
const STATUS_MESSAGES: Record<number, string> = {
  401: 'Tu sesión no es válida o expiró. Inicia sesión de nuevo.',
  403: 'No tienes permiso para hacer esto.',
  404: 'No encontramos lo que buscas. Verifica la información e intenta de nuevo.',
  409: 'Ya existe un registro con esa información.',
  422: 'Algo no está bien con la información enviada. Revisa los datos e intenta de nuevo.',
  429: 'Demasiados intentos. Espera un momento y vuelve a intentar.',
  500: 'Tuvimos un problema en nuestro lado. Intenta de nuevo en un momento.',
  502: 'Tuvimos un problema en nuestro lado. Intenta de nuevo en un momento.',
  503: 'Tuvimos un problema en nuestro lado. Intenta de nuevo en un momento.',
  504: 'Tuvimos un problema en nuestro lado. Intenta de nuevo en un momento.',
};

export function friendlyError(e: any, fallback: string): string {
  if (!e?.response) {
    return 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.';
  }

  const status: number = e.response.status;

  // 400 (Bad Request): prefer the backend's specific message when available.
  // Our GlobalExceptionHandler always returns { error: "..." } in Spanish.
  if (status === 400) {
    const backendMsg: string | undefined = e.response.data?.error;
    if (backendMsg && backendMsg.trim().length > 0) {
      return backendMsg;
    }
    return 'Algo no está bien con la información enviada. Revisa los datos e intenta de nuevo.';
  }

  // For all other statuses, also prefer a specific backend message if present,
  // then fall back to the generic table.
  const backendMsg: string | undefined = e.response.data?.error;
  if (backendMsg && backendMsg.trim().length > 0 && status >= 400 && status < 500) {
    return backendMsg;
  }

  if (STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];

  return fallback;
}
