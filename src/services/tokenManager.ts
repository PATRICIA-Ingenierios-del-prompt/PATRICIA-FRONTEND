const ACCESS_KEY  = 'patricia_access_token';
const REFRESH_KEY = 'patricia_refresh_token';

export const tokenManager = {
  getAccessToken:  (): string | null => sessionStorage.getItem(ACCESS_KEY),
  getRefreshToken: (): string | null => sessionStorage.getItem(REFRESH_KEY),
  setTokens: (access: string, refresh: string): void => {
    sessionStorage.setItem(ACCESS_KEY, access);
    sessionStorage.setItem(REFRESH_KEY, refresh);
  },
  clearTokens: (): void => {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  },
};
