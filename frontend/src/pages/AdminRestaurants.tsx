// frontend/src/pages/AdminRestaurants.tsx
import { useEffect, useMemo, useState } from "react";
import api from "../utils/api";
import {
  Container,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Chip,
  TextField,
  Box,
  Alert,
  CircularProgress,
} from "@mui/material";

type Owner = { name: string; email: string; role: string };

type Restaurant = {
  _id: string;
  name: string;
  isApproved: boolean;
  phone?: string;
  owner?: Owner;
  address?: {
    line1?: string;
    city?: string;
    district?: string;
    postalCode?: string;
  };
  createdAt?: string;
};

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchRestaurants = async () => {
    setError("");
    setLoading(true);
    try {
      const { data } = await api.get<Restaurant[]>("/api/restaurants");
      setRestaurants(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to load restaurants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const filteredRestaurants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return restaurants;
    return restaurants.filter(
      (restaurant) =>
        restaurant.name?.toLowerCase().includes(query) ||
        restaurant.owner?.name?.toLowerCase().includes(query) ||
        restaurant.owner?.email?.toLowerCase().includes(query)
    );
  }, [restaurants, searchQuery]);

  const handleApprovalChange = async (id: string, isApproved: boolean) => {
    setError("");
    setLoading(true);
    try {
      await api.patch(`/api/restaurants/${id}/approve`, { isApproved });
      await fetchRestaurants();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Admin · Restaurants
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          placeholder="Filter by name, owner or email…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flex: 1 }}
          size="small"
        />
        <Button variant="outlined" onClick={fetchRestaurants} disabled={loading}>
          Refresh
        </Button>
      </Box>

      <Paper>
        {loading ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <CircularProgress size={32} />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Loading restaurants…
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRestaurants.length > 0 ? (
                filteredRestaurants.map((restaurant) => (
                  <TableRow key={restaurant._id}>
                    <TableCell>{restaurant.name}</TableCell>
                    <TableCell>
                      {restaurant.owner
                        ? `${restaurant.owner.name} · ${restaurant.owner.email}`
                        : "—"}
                    </TableCell>
                    <TableCell>{restaurant.phone || "—"}</TableCell>
                    <TableCell>
                      {[
                        restaurant.address?.line1,
                        restaurant.address?.district,
                        restaurant.address?.city,
                        restaurant.address?.postalCode,
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={restaurant.isApproved ? "Approved" : "Pending"}
                        color={restaurant.isApproved ? "success" : "warning"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {restaurant.isApproved ? (
                        <Button
                          size="small"
                          onClick={() =>
                            handleApprovalChange(restaurant._id, false)
                          }
                        >
                          Unapprove
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() =>
                            handleApprovalChange(restaurant._id, true)
                          }
                        >
                          Approve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ p: 3 }}>
                    No restaurants found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table> 
        )}
      </Paper>
    </Container>
  );
}
