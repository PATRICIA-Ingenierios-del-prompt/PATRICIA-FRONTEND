/**
 * Turns an Axios/HTTP error into a plain-Spanish message a non-technical
 * user can act on — never a raw backend string, HTTP status, or stack trace.
 */
const STATUS_MESSAGES: Record<number, string> = {
  400: 'Algo no está bien con la información enviada. Revisa los datos e intenta de nuevo.',
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
  const status = e?.response?.status;
  if (status && STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];
  if (!e?.response) return 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.';
  return fallback;
}
