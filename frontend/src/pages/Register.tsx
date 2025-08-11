import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", isMerchant: false });
  const [err, setErr] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    try {
      const role = form.isMerchant ? "merchant" : "user";
      await register(form.name, form.email, form.password, role as any);
      navigate(form.isMerchant ? "/merchant/restaurant" : "/");
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Register failed");
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Create account</Typography>
        <Box component="form" onSubmit={onSubmit} sx={{ display: "grid", gap: 2 }}>
          {err && <Alert severity="error">{err}</Alert>}
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            required
          />
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            required
          />
          <TextField
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
            required
          />

          {/* Merchant seçeneği */}
          <FormControlLabel
            control={
              <Checkbox
                checked={form.isMerchant}
                onChange={(e) => setForm((s) => ({ ...s, isMerchant: e.target.checked }))}
              />
            }
            label="Restoran sahibiyim (merchant olarak kayıt ol)"
          />

          <Button type="submit" variant="contained">Create account</Button>
          <Typography variant="body2">
            Already have an account? <Link to="/login">Login</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
