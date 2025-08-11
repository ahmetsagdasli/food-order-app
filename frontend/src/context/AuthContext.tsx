import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../utils/api";

type User = { id: string; name: string; email: string; role: "user" | "admin" | "merchant" };
type AuthState = { user: User; token: string } | null;

type Ctx = {
  auth: AuthState;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, role?: "user" | "merchant") => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<Ctx>(null as unknown as Ctx);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>(() => {
    try {
      return JSON.parse(localStorage.getItem("auth") || "null");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (auth) localStorage.setItem("auth", JSON.stringify(auth));
    else localStorage.removeItem("auth");
  }, [auth]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post("/api/auth/login", { email, password });
    setAuth({ user: data.user, token: data.token });
    return data.user as User;
  };

  // ← role parametresi eklendi (default "user")
  const register = async (name: string, email: string, password: string, role: "user" | "merchant" = "user") => {
    const { data } = await api.post("/api/auth/register", { name, email, password, role });
    setAuth({ user: data.user, token: data.token });
    return data.user as User;
  };

  const logout = () => setAuth(null);

  const value = useMemo(() => ({ auth, login, register, logout }), [auth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
