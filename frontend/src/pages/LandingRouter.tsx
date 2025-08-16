import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Home from "./Home";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";

type Role = "merchant" | "admin" | "user" | undefined;

export default function LandingRouter() {
  const { auth, loading, error } = useAuth();
  const role: Role = auth?.user?.role as Role;

  const redirectPaths: Record<Exclude<Role, undefined | "user">, string> = {
    merchant: "/merchant/menu",
    admin: "/admin/restaurants",
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 480, mx: "auto", mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (role && role in redirectPaths) {
    return <Navigate to={redirectPaths[role as keyof typeof redirectPaths]} replace />;
  }

  return <Home />;
}
