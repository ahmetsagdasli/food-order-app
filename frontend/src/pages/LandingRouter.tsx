import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Home from "./Home";

export default function LandingRouter() {
  const { auth } = useAuth();

  if (auth?.user?.role === "merchant") return <Navigate to="/merchant/menu" replace />;
  if (auth?.user?.role === "admin") return <Navigate to="/admin/restaurants" replace />;

  // müşteri veya login olmayan -> ürün listesi
  return <Home />;
}
