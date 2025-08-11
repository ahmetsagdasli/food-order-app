// frontend/src/components/Protected.tsx  (tam dosya)
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Role = "user" | "merchant" | "admin";

export default function Protected({
  children,
  role,
  roles,
  deny,
  redirect = "/",
}: {
  children: ReactNode;
  role?: Role;
  roles?: Role[];
  deny?: Role[];
  redirect?: string;
}) {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;

  const r = auth.user.role as Role;
  if (roles && roles.length && !roles.includes(r)) return <Navigate to={redirect} replace />;
  if (role && r !== role) return <Navigate to={redirect} replace />;
  if (deny && deny.includes(r)) return <Navigate to={redirect} replace />;

  return <>{children}</>;
}
