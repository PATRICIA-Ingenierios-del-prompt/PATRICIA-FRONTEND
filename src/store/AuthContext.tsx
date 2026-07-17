import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { tokenManager } from '../services/tokenManager';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

// ── JWT helpers ───────────────────────────────────────────────────────────────

interface JwtClaims {
  sub?: string;
  userId?: string;
  id?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  roles?: string[];
}

function decodeJwt(token: string): JwtClaims | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

function extractUserId(token: string): string | null {
  const claims = decodeJwt(token);
  return claims?.sub ?? claims?.userId ?? claims?.id ?? null;
}

function extractRoles(token: string): string[] {
  const claims = decodeJwt(token);
  return Array.isArray(claims?.roles) ? claims.roles.map(String) : [];
}

/**
 * Derive display name from the JWT or — if no name claim — from the ECI
 * institutional email pattern: karol.estupinan-v@mail... → "Karol Estupinan"
 */
function extractUserInfo(token: string): { email: string | null; name: string | null } {
  const claims = decodeJwt(token);
  if (!claims) return { email: null, name: null };

  const email = claims.email ?? claims.preferred_username ?? null;

  // 1. Standard JWT name claims
  const jwtName =
    claims.name ??
    (claims.given_name && claims.family_name
      ? claims.given_name + ' ' + claims.family_name
      : null) ??
    claims.given_name ??
    null;

  if (jwtName) return { email, name: jwtName };

  // 2. Derive from ECI email: <firstname>.<lastname>[-suffix]@domain
  if (email) {
    const local = email.split('@')[0];           // "karol.estupinan-v"
    const dot = local.indexOf('.');
    if (dot !== -1) {
      const firstName = local.slice(0, dot);     // "karol"
      const lastName  = local.slice(dot + 1).split('-')[0]; // "estupinan"
      const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      return { email, name: cap(firstName) + ' ' + cap(lastName) };
    }
  }

  return { email, name: null };
}

// ── Context shape ─────────────────────────────────────────────────────────────

interface AuthContextValue {
  accessToken: string | null;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  roles: string[];
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  setUserName: (name: string) => void;
}

const AuthContext = createContext<AuthContextValue>({
  accessToken: null,
  userId: null,
  userEmail: null,
  userName: null,
  roles: [],
  isAuthenticated: false,
  login: () => {},
  logout: async () => {},
  setUserName: () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
  onLogout?: () => void;
}

export function AuthProvider({ children, onLogout }: AuthProviderProps) {
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    tokenManager.getAccessToken(),
  );
  const [userId, setUserId] = useState<string | null>(() => {
    const t = tokenManager.getAccessToken();
    return t ? extractUserId(t) : null;
  });
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    const t = tokenManager.getAccessToken();
    return t ? extractUserInfo(t).email : null;
  });
  const [userName, setUserName] = useState<string | null>(() => {
    const t = tokenManager.getAccessToken();
    return t ? extractUserInfo(t).name : null;
  });
  const [roles, setRoles] = useState<string[]>(() => {
    const t = tokenManager.getAccessToken();
    return t ? extractRoles(t) : [];
  });

  // On mount: if we have a stored token but no name, try the profile service
  useEffect(() => {
    const token = tokenManager.getAccessToken();
    if (!token) return;
    const info = extractUserInfo(token);
    if (info.name) return; // already derived from email or JWT
    const uid = extractUserId(token);
    if (!uid) return;
    userService.getPerfil(uid)
      .then(p => {
        const name = [p.nombre, p.apellidos].filter(Boolean).join(' ').trim();
        if (name) setUserName(name);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback((newAccessToken: string, newRefreshToken: string) => {
    tokenManager.setTokens(newAccessToken, newRefreshToken);
    setAccessToken(newAccessToken);
    const uid = extractUserId(newAccessToken);
    setUserId(uid);
    const info = extractUserInfo(newAccessToken);
    setUserEmail(info.email);
    setUserName(info.name);
    setRoles(extractRoles(newAccessToken));

    if (import.meta.env.DEV) {
      console.debug('[AuthContext] JWT claims:', decodeJwt(newAccessToken));
    }

    // If email pattern didn't yield a name, try the profile service
    if (!info.name && uid) {
      userService.getPerfil(uid)
        .then(p => {
          const name = [p.nombre, p.apellidos].filter(Boolean).join(' ').trim();
          if (name) setUserName(name);
        })
        .catch(() => {});
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setAccessToken(null);
    setUserId(null);
    setUserEmail(null);
    setUserName(null);
    setRoles([]);
    onLogout?.();
  }, [onLogout]);

  const setUserNameExternal = useCallback((name: string) => setUserName(name), []);

  return (
    <AuthContext.Provider value={{
      accessToken, userId, userEmail, userName, roles,
      isAuthenticated: !!accessToken,
      login, logout, setUserName: setUserNameExternal,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
