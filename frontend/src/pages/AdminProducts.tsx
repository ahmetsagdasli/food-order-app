// frontend/src/pages/AdminProducts.tsx
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  InputAdornment,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import axios, { AxiosError } from "axios";
import ProductEditDialog from "../components/ProductEditDialog";

interface Product {
  _id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ProductsResponse {
  items: Product[];
  total: number;
}

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:5000";
const PAGE_SIZE = 10;

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const totalStockValue = useMemo(() => {
    return products.reduce((sum, p) => sum + (typeof p.price === "number" ? p.price : 0), 0);
  }, [products]);

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {
      limit: String(PAGE_SIZE),
      page: String(page),
      sort: "createdAt:desc",
    };
    if (search.trim()) params.q = search.trim();
    return params;
  }, [page, search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get<ProductsResponse>(`${API_BASE}/api/products`, {
        params: queryParams,
      });

      setProducts(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(
        axiosErr.response?.data?.message || axiosErr.message || "Failed to fetch products"
      );
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOpenEdit = (id: string) => {
    setSelectedId(id);
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setSelectedId(null);
  };

  const handleSaved = () => {
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu ürünü silmek istediğine emin misin?")) return;
    try {
      await axios.delete(`${API_BASE}/api/products/${id}`);
      const remaining = products.length - 1;
      if (remaining === 0 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        fetchProducts();
      }
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      alert(
        axiosErr.response?.data?.message || axiosErr.message || "Delete failed"
      );
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(value);

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Products</Typography>

        <Box display="flex" gap={1} alignItems="center">
          <TextField
            size="small"
            placeholder="Search by name/desc"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Tooltip title="Refresh">
            <IconButton onClick={fetchProducts} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Summary Bar */}
      <Box
        mb={2}
        p={1.5}
        bgcolor="#f9f9f9"
        borderRadius={1}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={1}
      >
        <Typography variant="body2" color="text.secondary">
          Total Products: <strong>{loading ? "…" : total}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Showing: <strong>{loading ? "…" : products.length}</strong> / {PAGE_SIZE} per page
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total Stock Value: <strong>{loading ? "…" : formatCurrency(totalStockValue)}</strong>
        </Typography>
      </Box>

      {/* Product Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box py={6} display="flex" gap={2} alignItems="center" justifyContent="center">
              <CircularProgress />
              <Typography>Loading…</Typography>
            </Box>
          ) : error ? (
            <Box p={2} sx={{ bgcolor: "#ffe6e6", color: "#b00020", borderRadius: 2 }}>
              {error}
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width={64}>Image</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right" width={140}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map((p) => (
                      <TableRow key={p._id} hover>
                        <TableCell>
                          {p.imageUrl ? (
                            <Box
                              component="img"
                              src={p.imageUrl}
                              alt={p.name}
                              sx={{
                                width: 56,
                                height: 40,
                                objectFit: "cover",
                                borderRadius: 1,
                                border: "1px solid #eee",
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 56,
                                height: 40,
                                borderRadius: 1,
                                border: "1px dashed #ccc",
                              }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={600}>{p.name}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          {typeof p.price === "number"
                            ? formatCurrency(p.price)
                            : String(p.price)}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 420 }}>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {p.description}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <IconButton onClick={() => handleOpenEdit(p._id)} size="small">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              onClick={() => handleDelete(p._id)}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}

                    {products.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <Box py={4} textAlign="center" color="text.secondary">
                            No products found
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              <Box mt={2} display="flex" justifyContent="center">
                <Pagination
                  color="primary"
                  page={page}
                  count={pageCount}
                  onChange={(_, value) => setPage(value)}
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <ProductEditDialog
        open={editOpen}
        productId={selectedId}
        onClose={handleCloseEdit}
        onSaved={handleSaved}
      />
    </Box>
  );
}
