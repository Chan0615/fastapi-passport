import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authApi, LoginRequest, UserInfo, MenuItem } from '../services/authApi';

interface AuthState {
  user: UserInfo | null;
  token: string | null;
  menus: MenuItem[];
  permissions: string[];
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshMenus: (projectCode: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const TOKEN_KEY = 'access_token';
const PROJECT_CODE_KEY = 'fastapi_passport_project_code';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    authApi.me()
      .then((u) => {
        setUser(u);
        const savedProjectCode = localStorage.getItem(PROJECT_CODE_KEY) || 'fastapi_passport';
        authApi.menus(savedProjectCode).then(setMenus).catch(() => setMenus([]));
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const res = await authApi.login(data);
    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(PROJECT_CODE_KEY, res.project_code);
    setToken(res.access_token);
    setUser(res.user);
    setMenus(res.menus);
    setPermissions(res.permissions);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setMenus([]);
    setPermissions([]);
  }, []);

  const refreshMenus = useCallback(async (projectCode: string) => {
    const m = await authApi.menus(projectCode);
    setMenus(m);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, menus, permissions, loading, login, logout, refreshMenus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内使用');
  return ctx;
}
