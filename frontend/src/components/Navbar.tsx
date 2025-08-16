// frontend/src/components/Navbar.tsx
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Box from "@mui/material/Box";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useCartCount from "../hooks/useCartCount";

type UserRole = "user" | "merchant" | "admin" | undefined;

export default function Navbar() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const role: UserRole = auth?.user?.role;
  const cartCount: number = useCartCount();

  const isGuest = !auth;
  const isUser = role === "user";
  const isMerchant = role === "merchant";
  const isAdmin = role === "admin";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const UserSection = () => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 1 }}>
      <Typography variant="body2">Hi, {auth?.user?.name}</Typography>
      <Button color="inherit" onClick={handleLogout}>
        Logout
      </Button>
    </Box>
  );

  return (
    <AppBar position="static">
      <Toolbar sx={{ gap: 2 }}>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{ color: "#fff", textDecoration: "none", flexGrow: 1 }}
        >
          FoodOrder
        </Typography>

        {/* Public (Guest & User) */}
        {(isGuest || isUser) && (
          <>
            <Button color="inherit" component={Link} to="/products">
              Products
            </Button>
            <Button color="inherit" component={Link} to="/map">
              Map
            </Button>
          </>
        )}

        {/* Guest */}
        {isGuest && (
          <>
            <Button color="inherit" component={Link} to="/login">
              Login
            </Button>
            <Button color="inherit" component={Link} to="/register">
              Register
            </Button>
          </>
        )}

        {/* Customer */}
        {isUser && (
          <>
            <IconButton color="inherit" onClick={() => navigate("/cart")}>
              <Badge badgeContent={cartCount} color="secondary">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
            <Button color="inherit" component={Link} to="/orders">
              My Orders
            </Button>
            <UserSection />
          </>
        )}

        {/* Merchant */}
        {isMerchant && (
          <>
            <Button color="inherit" component={Link} to="/merchant/restaurant">
              My Restaurant
            </Button>
            <Button color="inherit" component={Link} to="/merchant/menu">
              My Menu
            </Button>
            <Button color="inherit" component={Link} to="/merchant/orders">
              Orders
            </Button>
            <UserSection />
          </>
        )}

        {/* Admin */}
        {isAdmin && (
          <>
            <Button color="inherit" component={Link} to="/admin/restaurants">
              Restaurants
            </Button>
            <Button color="inherit" component={Link} to="/admin/products">
              Products
            </Button>
            <Button color="inherit" component={Link} to="/admin/orders">
              Orders
            </Button>
            <UserSection />
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
