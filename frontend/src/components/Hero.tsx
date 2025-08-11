import { keyframes } from "@emotion/react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Yumuşak bir Ken Burns (zoom + hafif yukarı kayma)
const kenburns = keyframes`
  0%   { transform: scale(1) translateY(0%); }
  100% { transform: scale(1.1) translateY(-2%); }
`;

type HeroProps = {
  imageUrl?: string;
  title?: string;
  subtitle?: string;
};

export default function Hero({
  imageUrl = "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=1600&auto=format&fit=crop",
  title = "Hot & Fresh. Delivered Fast.",
  subtitle = "Şehrinin favori restoranlarından sıcacık lezzetler."
}: HeroProps) {
  const { auth } = useAuth();
  const role = auth?.user?.role;

  return (
    <Box sx={{ position: "relative", px: { xs: 1.5, sm: 2 }, mt: 2 }}>
      {/* Arka plan görsel (animasyonlu) */}
      <Box
        sx={{
          position: "relative",
          height: { xs: 320, sm: 420, md: 520 },
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: 6,
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.8)",
            animation: `${kenburns} 18s ease-in-out infinite alternate`,
            transformOrigin: "center center",
          },
          "&::after": {
            // gradient overlay
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.75) 100%)",
          },
        }}
      />

      {/* İçerik */}
      <Container
        maxWidth="lg"
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "flex-end",
          pb: { xs: 3, sm: 4, md: 6 },
        }}
      >
        <Stack spacing={2} sx={{ color: "#fff" }}>
          <Chip
            label="Yeni · Kampanyalı menüler"
            variant="filled"
            sx={{ width: "fit-content", bgcolor: "rgba(255,255,255,0.18)", color: "#fff", backdropFilter: "blur(6px)" }}
          />
          <Typography variant="h3" fontWeight={800} lineHeight={1.1}
            sx={{ fontSize: { xs: 28, sm: 40, md: 56 } }}>
            {title}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.95, maxWidth: 720 }}>
            {subtitle}
          </Typography>

          {/* CTA'lar rol’e göre */}
          {role === "merchant" ? (
            <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
              <Button component={RouterLink} to="/merchant/menu" size="large" variant="contained">
                My Menu
              </Button>
              <Button component={RouterLink} to="/merchant/restaurant" size="large" variant="outlined" sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.6)" }}>
                My Restaurant
              </Button>
            </Stack>
          ) : role === "admin" ? (
            <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
              <Button component={RouterLink} to="/admin/restaurants" size="large" variant="contained">
                Manage Restaurants
              </Button>
              <Button component={RouterLink} to="/admin/products" size="large" variant="outlined" sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.6)" }}>
                Manage Products
              </Button>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
              <Button component={RouterLink} to="/products" size="large" variant="contained">
                Explore Foods
              </Button>
              <Button component={RouterLink} to="/register" size="large" variant="outlined" sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.6)" }}>
                Join Now
              </Button>
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
