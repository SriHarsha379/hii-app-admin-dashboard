import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'EVENT_ADMIN' | 'CITY_ADMIN' | 'CLUB_ADMIN' | 'ADMIN' | 'NORMAL_ADMIN';
  organisation?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  updateUser: (data: Partial<User>) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage on mount so a page refresh doesn't
    // force the user back to the login page.
    try {
      const savedToken = localStorage.getItem('hii_admin_token');
      const savedUser  = localStorage.getItem('hii_admin_user');
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch {
      // Corrupt localStorage value — clear it and fall through to login
      localStorage.removeItem('hii_admin_token');
      localStorage.removeItem('hii_admin_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('hii_admin_token', newToken);
    localStorage.setItem('hii_admin_user', JSON.stringify(newUser));
  };

  const updateUser = (data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updatedUser = { ...prev, ...data };
      localStorage.setItem('hii_admin_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('hii_admin_token');
    localStorage.removeItem('hii_admin_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, updateUser, logout, isLoading }}>
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