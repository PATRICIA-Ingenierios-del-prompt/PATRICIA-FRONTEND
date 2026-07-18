/**
 * Turns an Axios/HTTP error into a plain, user-friendly message —
 * never a raw backend string, HTTP status, or stack trace.
 *
 * Priority:
 *  1. If the backend returned { "error": "..." } in the body, use it directly
 *     (our backend already speaks the user's language from the domain exceptions).
 *  2. Fall back to the generic per-status i18n message.
 *  3. If there's no response at all, show a connectivity message.
 *  4. If nothing matches, use the provided fallback.
 */
import i18n from 'i18next';

const STATUS_KEYS: Record<number, string> = {
  401: 'errors.e401',
  403: 'errors.e403',
  404: 'errors.e404',
  409: 'errors.e409',
  422: 'errors.e422',
  429: 'errors.e429',
  500: 'errors.e5xx',
  502: 'errors.e5xx',
  503: 'errors.e5xx',
  504: 'errors.e5xx',
};

export function friendlyError(e: any, fallback: string): string {
  if (!e?.response) {
    return i18n.t('errors.no_connection');
  }

  const status: number = e.response.status;

  if (status === 400) {
    const backendMsg: string | undefined = e.response.data?.error;
    if (backendMsg && backendMsg.trim().length > 0) {
      return backendMsg;
    }
    return i18n.t('errors.e422');
  }

  const backendMsg: string | undefined = e.response.data?.error;
  if (backendMsg && backendMsg.trim().length > 0 && status >= 400 && status < 500) {
    return backendMsg;
  }

  if (STATUS_KEYS[status]) return i18n.t(STATUS_KEYS[status]);

  return fallback;
}
