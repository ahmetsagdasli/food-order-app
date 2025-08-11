import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <Box component="footer" sx={{ mt: 6, pt: 4, pb: 4, bgcolor: "grey.100", borderTop: 1, borderColor: "divider" }}>
      <Container>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6">FoodOrder</Typography>
            <Typography variant="body2" color="text.secondary">
              Hızlı ve güvenli yemek sipariş platformu.
            </Typography>
          </Grid>

          <Grid item xs={6} md={4}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Keşfet</Typography>
            <Box sx={{ display: "grid", gap: .5 }}>
              <Link href="/products" underline="hover" color="inherit">Products</Link>
              <Link href="/map" underline="hover" color="inherit">Map</Link>
              <Link href="/login" underline="hover" color="inherit">Login</Link>
            </Box>
          </Grid>

          <Grid item xs={6} md={4}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>İletişim</Typography>
            <Typography variant="body2" color="text.secondary">support@foodorder.dev</Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Typography variant="caption" color="text.secondary">
            © {year} FoodOrder — All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
