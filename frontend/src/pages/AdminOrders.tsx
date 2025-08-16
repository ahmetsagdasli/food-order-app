// frontend/src/pages/AdminOrders.tsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import type { Order } from "../types";
import {
  Container,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Select,
  MenuItem,
  Chip,
  Button,
  Box,
  CircularProgress,
  Alert,
  TablePagination,
} from "@mui/material";

type OrderStatus = "pending" | "preparing" | "on_the_way" | "delivered" | "cancelled";
const STATUSES: readonly OrderStatus[] = ["pending", "preparing", "on_the_way", "delivered", "cancelled"];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);

  const navigate = useNavigate();

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get<{ items: Order[]; total: number }>("/api/orders", {
        params: {
          status: status || undefined,
          limit: rowsPerPage,
          skip: page * rowsPerPage,
        },
      });
      setOrders(data.items);
      setTotalOrders(data.total || 0);
    } catch (err: any) {
      console.error("Failed to load orders:", err);
      setError(err?.response?.data?.message || err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [status, page, rowsPerPage]);

  const updateStatus = useCallback(
    async (id: string, newStatus: OrderStatus) => {
      setLoading(true);
      setError("");
      try {
        await api.patch(`/api/orders/${id}/status`, { status: newStatus });
        await loadOrders();
      } catch (err: any) {
        console.error("Failed to update order status:", err);
        setError(err?.response?.data?.message || err.message || "Failed to update status");
        setLoading(false);
      }
    },
    [loadOrders]
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Admin · Orders
      </Typography>

      {/* Filter bar */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <Select
          size="small"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as OrderStatus | "");
            setPage(0);
          }}
          displayEmpty
        >
          <MenuItem value="">All</MenuItem>
          {STATUSES.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </Select>
        <Button variant="outlined" onClick={loadOrders} disabled={loading}>
          Refresh
        </Button>
      </Box>

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading state */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o._id}>
                  <TableCell>…{o._id.slice(-6)}</TableCell>
                  <TableCell>{new Date(o.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{o.items.length}</TableCell>
                  <TableCell>{o.totalAmount.toFixed(2)} ₺</TableCell>
                  <TableCell>
                    <Chip label={o.status} />
                  </TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      value={o.status}
                      onChange={(e) => updateStatus(o._id, e.target.value as OrderStatus)}
                    >
                      {STATUSES.map((s) => (
                        <MenuItem key={s} value={s}>
                          {s}
                        </MenuItem>
                      ))}
                    </Select>
                    <Button
                      sx={{ ml: 1 }}
                      size="small"
                      onClick={() => navigate(`/orders/${o._id}`)}
                    >
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {/* Eğer hiç sipariş yoksa */}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Sayfalama */}
          <TablePagination
            component="div"
            count={totalOrders}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </Paper>
      )}
    </Container>
  );
}
