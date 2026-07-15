import { apiClient, type TokenResponse } from './apiClient';
import { tokenManager } from './tokenManager';

export type { TokenResponse };
export type AuthTokens = TokenResponse;

export const authService = {
  /** POST /auth/otp/request — sends 6-digit code to the given email */
  async requestOtp(email: string): Promise<void> {
    await apiClient.post('/auth/otp/request', { email });
  },

  /** POST /auth/otp/verify — verifies code and returns JWT tokens */
  async verifyOtp(email: string, code: string): Promise<TokenResponse> {
    const { data } = await apiClient.post<TokenResponse>('/auth/otp/verify', { email, code });
    return data;
  },

  /** POST /auth/login/microsoft — exchanges OAuth2 code for JWT tokens */
  async loginMicrosoft(code: string, redirectUri?: string): Promise<TokenResponse> {
    const { data } = await apiClient.post<TokenResponse>('/auth/login/microsoft', {
      code,
      ...(redirectUri ? { redirectUri } : {}),
    });
    return data;
  },

  /** POST /auth/refresh — rotates both tokens */
  async refresh(refreshToken: string): Promise<TokenResponse> {
    const { data } = await apiClient.post<TokenResponse>('/auth/refresh', { refreshToken });
    return data;
  },

  /** POST /auth/validate — server-side token introspection */
  async validate(token: string): Promise<Record<string, unknown>> {
    const { data } = await apiClient.post<Record<string, unknown>>('/auth/validate', { token });
    return data;
  },

  /** POST /auth/logout — invalidates refresh token, then clears local storage */
  async logout(): Promise<void> {
    const refreshToken = tokenManager.getRefreshToken();
    tokenManager.clearTokens();
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', { refreshToken });
      } catch {
        // Swallow — tokens already cleared locally
      }
    }
  },
};
