import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../utils/api";

type User = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "merchant";
};

type AuthState = { user: User; token: string } | null;

type Ctx = {
  auth: AuthState;
  loading: boolean;
  error: string;
  login: (email: string, password: string) => Promise<User>;
  register: (
    name: string,
    email: string,
    password: string,
    role?: "user" | "merchant"
  ) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<Ctx>(null as unknown as Ctx);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // İlk açılışta token varsa backend ile oturum doğrulama
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedAuth = localStorage.getItem("auth");
        if (!savedAuth) {
          setAuth(null);
          return;
        }

        const parsedAuth = JSON.parse(savedAuth);
        if (!parsedAuth?.token) {
          setAuth(null);
          return;
        }

        // Token'ı header'a ekleyerek /me isteği at
        const { data } = await api.get("/api/auth/me", {
          headers: { Authorization: `Bearer ${parsedAuth.token}` },
        });

        setAuth({ user: data.user, token: parsedAuth.token });
        setError("");
      } catch {
        setAuth(null);
        setError("Oturum doğrulanamadı. Lütfen tekrar giriş yapın.");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Auth değişince localStorage güncelle
  useEffect(() => {
    if (auth) localStorage.setItem("auth", JSON.stringify(auth));
    else localStorage.removeItem("auth");
  }, [auth]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      setAuth({ user: data.user, token: data.token });
      return data.user as User;
    } catch (err: any) {
      setError(err?.response?.data?.error || "Giriş başarısız.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: "user" | "merchant" = "user"
  ) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/api/auth/register", {
        name,
        email,
        password,
        role,
      });
      setAuth({ user: data.user, token: data.token });
      return data.user as User;
    } catch (err: any) {
      setError(err?.response?.data?.error || "Kayıt başarısız.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuth(null);
    localStorage.removeItem("auth");
  };

  const value = useMemo(
    () => ({ auth, loading, error, login, register, logout }),
    [auth, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
