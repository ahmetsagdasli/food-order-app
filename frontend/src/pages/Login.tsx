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
import CircularProgress from "@mui/material/CircularProgress";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      nav("/");
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Login
        </Typography>
        <Box
          component="form"
          onSubmit={onSubmit}
          sx={{ display: "grid", gap: 2 }}
        >
          {err && <Alert severity="error">{err}</Alert>}

          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm((s) => ({ ...s, email: e.target.value }))
            }
            required
            disabled={loading}
          />

          <TextField
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((s) => ({ ...s, password: e.target.value }))
            }
            required
            disabled={loading}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>

          <Typography variant="body2">
            No account? <Link to="/register">Register</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
