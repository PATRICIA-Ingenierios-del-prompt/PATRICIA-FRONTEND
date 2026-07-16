import axios from 'axios';
import { tokenManager } from './tokenManager';
import { SESSION_EXPIRED_KEY } from '../lib/sessionKeys';

/**
 * Single HTTP client — always talks to the API Gateway (VITE_API_URL).
 * The proxy in vite.config.ts forwards /auth and /api/v1 to localhost:8080
 * so we use relative paths to avoid CORS in dev.
 */
export const apiClient = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach Bearer token to everything except /auth/** ──
apiClient.interceptors.request.use(config => {
  const url = config.url ?? '';
  const isAuthRoute = url.startsWith('/auth/');
  if (!isAuthRoute) {
    const token = tokenManager.getAccessToken();
    if (token) config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

// ── Response interceptor — auto-refresh on 401 ───────────────────────────────
let isRefreshing = false;
let pendingQueue: ((token: string) => void)[] = [];

function flushQueue(token: string) {
  pendingQueue.forEach(cb => cb(token));
  pendingQueue = [];
}

apiClient.interceptors.response.use(
  res => {
    // CloudFront's SPA fallback (custom_error_response in Ulink_Infra
    // modules/frontend/main.tf) rewrites origin 403/404 into "200 index.html",
    // so a denied API call (e.g. deleting a parche you don't own) looks like a
    // success with an HTML body. Unmask it: an API route answering HTML is
    // always that rewrite — surface it as the 403 it originally was.
    const url = res.config?.url ?? '';
    const contentType = String(res.headers?.['content-type'] ?? '');
    const looksHtml = contentType.includes('text/html')
      || (typeof res.data === 'string' && /^\s*<!doctype html|^\s*<html/i.test(res.data));
    if (looksHtml && (url.startsWith('/api/') || url.startsWith('/matching') || url.startsWith('/auth/'))) {
      const err: any = new Error('CloudFront SPA fallback masked an origin error');
      err.config = res.config;
      err.response = { ...res, status: 403, data: { error: 'Request was rejected by the origin (masked by SPA fallback)' } };
      return Promise.reject(err);
    }
    return res;
  },
  async error => {
    const original = error.config;
    const url: string = original?.url ?? '';

    // Only retry on 401, not on auth endpoints themselves, and only once
    if (
      error.response?.status !== 401 ||
      original._retry ||
      url.startsWith('/auth/')
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      return new Promise(resolve => {
        pendingQueue.push(token => {
          original.headers.Authorization = 'Bearer ' + token;
          resolve(apiClient(original));
        });
      });
    }

    isRefreshing = true;
    try {
      const refreshToken = tokenManager.getRefreshToken();
      if (!refreshToken) throw new Error('no refresh token');

      const { data } = await apiClient.post<TokenResponse>(
        '/auth/refresh',
        { refreshToken },
      );
      tokenManager.setTokens(data.accessToken, data.refreshToken);
      flushQueue(data.accessToken);

      original.headers.Authorization = 'Bearer ' + data.accessToken;
      return apiClient(original);
    } catch {
      tokenManager.clearTokens();
      sessionStorage.setItem(SESSION_EXPIRED_KEY, '1');
      window.location.reload();
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

// ── Shared response type ──────────────────────────────────────────────────────
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}
