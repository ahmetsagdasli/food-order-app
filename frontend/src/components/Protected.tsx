// frontend/src/components/Protected.tsx
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export type Role = "user" | "merchant" | "admin";

type ProtectedProps = {
  children: ReactNode;
  /** Yalnızca tek bir role izin ver */
  role?: Role;
  /** Belirtilen rollerden en az birine izin ver */
  roles?: Role[];
  /** Bu rolleri engelle */
  deny?: Role[];
  /** Yetkisiz erişimde yönlendirilecek sayfa */
  redirect?: string;
};

export default function Protected({
  children,
  role,
  roles,
  deny,
  redirect = "/",
}: ProtectedProps) {
  const { auth } = useAuth();

  // Ortak yönlendirme fonksiyonu
  const redirectTo = () => <Navigate to={redirect} replace />;

  // Kullanıcı giriş yapmamışsa
  if (!auth) return <Navigate to="/login" replace />;

  const userRole: Role | undefined = auth.user?.role;

  // Rol bulunmuyorsa veya geçersizse
  if (!userRole) return redirectTo();

  // Yetkilendirme kontrolleri
  if (roles?.length && !roles.includes(userRole)) return redirectTo();
  if (role && userRole !== role) return redirectTo();
  if (deny?.includes(userRole)) return redirectTo();

  return <>{children}</>;
}
