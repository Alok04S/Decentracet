import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "issuer" | "student" | "verifier";
  studentId?: string;
  institution?: {
    id: string;
    name: string;
  } | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("decentracert_token"));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("decentracert_token");
      if (storedToken) {
        try {
          const res = await api.get("/auth/me");
          if (res.data.success) {
            setUser(res.data.user);
          } else {
            logout();
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("decentracert_token", newToken);
    localStorage.setItem("decentracert_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("decentracert_token");
    localStorage.removeItem("decentracert_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin" || user?.role === "issuer",
        isStudent: user?.role === "student",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
