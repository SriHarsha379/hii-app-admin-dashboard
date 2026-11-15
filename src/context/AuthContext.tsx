import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'EVENT_ADMIN' | 'CITY_ADMIN' | 'CLUB_ADMIN' | 'ADMIN' | 'NORMAL_ADMIN';
  organisation?: string;
  vendorId?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  updateUser: (data: Partial<User>) => void;
  logout: () => void;
  authFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  isLoading: boolean;
}

// ISSUE 2 FIX: check JWT exp before restoring session
function isTokenExpired(token: string): boolean {
  try {
    const b64 = token.split('.')[1];
    if (!b64) return true;
    const payload = JSON.parse(atob(b64.replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof payload.exp !== 'number') return false;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

const TOKEN_KEY = 'hii_admin_token';
const USER_KEY  = 'hii_admin_user';
const storage   = sessionStorage;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser]           = useState<User | null>(null);
  const [token, setToken]         = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedToken = storage.getItem(TOKEN_KEY);
      const savedUser  = storage.getItem(USER_KEY);
      if (savedToken && savedUser) {
        if (isTokenExpired(savedToken)) {
          storage.removeItem(TOKEN_KEY);
          storage.removeItem(USER_KEY);
        } else {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      }
    } catch {
      storage.removeItem(TOKEN_KEY);
      storage.removeItem(USER_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    storage.setItem(TOKEN_KEY, newToken);
    storage.setItem(USER_KEY, JSON.stringify(newUser));
  };

  const updateUser = (data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      storage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    storage.removeItem(TOKEN_KEY);
    storage.removeItem(USER_KEY);
  };

  const authFetch = async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
    const res = await fetch(input, init);
    if (res.status === 401) logout();
    return res;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, updateUser, logout, authFetch, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
