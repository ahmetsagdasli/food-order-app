// frontend/src/pages/MerchantMenu.tsx
import { useEffect, useState, useCallback } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Alert,
  Box,
  Chip,
} from "@mui/material";
import api from "../utils/api";
import ProductEditDialog, { type ProductEditData } from "../components/ProductEditDialog";

// ==== Types ====
interface Product {
  readonly _id: string;
  name: string;
  price: number;
  category?: string;
  imageUrl?: string;
  description?: string;
  isAvailable?: boolean;
}

interface Restaurant {
  readonly _id: string;
  name: string;
  isApproved: boolean;
}

interface ProductFormData {
  name: string;
  price: string; // string tutuluyor, submit'te parse ediliyor
  category: string;
  imageUrl: string;
}

interface ProductsResponse {
  items: Product[];
}

// ==== Constants ====
const INITIAL_FORM_STATE: ProductFormData = {
  name: "",
  price: "",
  category: "",
  imageUrl: "",
};

const GRID_BREAKPOINTS = {
  xs: 12,
  md: 6,
  lg: 4,
} as const;

const DEFAULT_CATEGORY = "general";

// ==== Helpers ====
function getErrorMessage(err: unknown, fallback = "Unexpected error"): string {
  if (err instanceof Error) return err.message;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyErr = err as any;
  return anyErr?.response?.data?.error || anyErr?.message || fallback;
}

// ==== Component ====
export default function MerchantMenu(): JSX.Element {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM_STATE);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductEditData | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Derived
  const isRestaurantApproved = Boolean(restaurant?.isApproved);
  const canCreateProduct = isRestaurantApproved && formData.name.trim() && formData.price.trim();

  // API: load restaurant + products
  const fetchRestaurantData = useCallback(async (): Promise<void> => {
    setError("");
    setIsLoading(true);
    try {
      // restaurant
      const rRes = await api.get<Restaurant>("/api/restaurants/me").catch(() => ({ data: null as Restaurant | null }));
      setRestaurant(rRes.data);

      // products
      const pRes = await api.get<ProductsResponse>("/api/products", {
        params: { limit: 100, sort: "createdAt:desc", mine: true },
      });
      setProducts(pRes.data.items);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load data"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRestaurantData();
  }, [fetchRestaurantData]);

  // CREATE
  const createProduct = useCallback(async (): Promise<void> => {
    if (!canCreateProduct) return;

    setError("");
    const parsedPrice = Number(formData.price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError("Please enter a valid (non-negative) price.");
      return;
    }

    try {
      await api.post("/api/products", {
        name: formData.name.trim(),
        price: parsedPrice,
        category: formData.category.trim() || DEFAULT_CATEGORY,
        imageUrl: formData.imageUrl.trim(),
      });

      setFormData(INITIAL_FORM_STATE);
      await fetchRestaurantData();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create product"));
    }
  }, [canCreateProduct, fetchRestaurantData, formData.category, formData.imageUrl, formData.name, formData.price]);

  // DELETE
  const deleteProduct = useCallback(async (productId: string): Promise<void> => {
    setError("");
    try {
      await api.delete(`/api/products/${productId}`);
      setProducts((prev) => prev.filter((p) => p._id !== productId));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete product"));
    }
  }, []);

  // Form handlers
  const handleFormChange = useCallback(
    (field: keyof ProductFormData) =>
      (event: React.ChangeEvent<HTMLInputElement>): void => {
        setFormData((prev) => ({ ...prev, [field]: event.target.value }));
      },
    []
  );

  // Edit handlers
  const handleEditProduct = useCallback((product: Product): void => {
    setEditingProduct({
      _id: product._id,
      name: product.name,
      price: product.price,
      category: product.category,
      imageUrl: product.imageUrl,
      description: product.description,
      isAvailable: product.isAvailable,
    });
    setIsEditDialogOpen(true);
  }, []);

  const handleCloseEditDialog = useCallback((): void => {
    setIsEditDialogOpen(false);
    setEditingProduct(null);
  }, []);

  // Optimistic update from dialog
  const handleOptimisticUpdate = useCallback(
    (draft: ProductEditData) => {
      // Snapshot (önceki referansı sakla — immutable kalıyor)
      const snapshot = products;
      // Hemen UI'yı güncelle
      setProducts((prev) => prev.map((p) => (p._id === draft._id ? ({ ...p, ...draft } as Product) : p)));
      // Rollback fonksiyonu döndür
      return () => setProducts(snapshot);
    },
    [products]
  );

  const handleProductSaved = useCallback((updated: ProductEditData): void => {
    setProducts((prev) => prev.map((p) => (p._id === updated._id ? ({ ...p, ...updated } as Product) : p)));
    handleCloseEditDialog();
  }, [handleCloseEditDialog]);

  const handleEditError = useCallback((message: string): void => {
    setError(message || "Failed to update product");
  }, []);

  // Render helpers
  const renderRestaurantStatus = (): JSX.Element =>
    restaurant ? (
      <Chip label={isRestaurantApproved ? "Approved" : "Pending approval"} color={isRestaurantApproved ? "success" : "warning"} />
    ) : (
      <Chip label="No restaurant" color="default" />
    );

  const renderProductCard = (product: Product): JSX.Element => (
    <Grid key={product._id} size={GRID_BREAKPOINTS}>
      <Card>
        <CardContent>
          <Typography variant="h6">{product.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {product.category || "—"} · {product.price} ₺
            {product.isAvailable === false && " · (unavailable)"}
          </Typography>
        </CardContent>
        <CardActions>
          <Button size="small" onClick={() => handleEditProduct(product)}>
            Edit
          </Button>
          <Button size="small" color="error" onClick={() => deleteProduct(product._id)}>
            Delete
          </Button>
        </CardActions>
      </Card>
    </Grid>
  );

  const renderProductForm = (): JSX.Element => (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 2 }}>
        <TextField label="Name" value={formData.name} onChange={handleFormChange("name")} required />
        <TextField
          label="Price"
          type="number"
          inputProps={{ min: 0, step: "0.01" }}
          value={formData.price}
          onChange={handleFormChange("price")}
          required
        />
        <TextField label="Category" value={formData.category} onChange={handleFormChange("category")} />
        <TextField label="Image URL" value={formData.imageUrl} onChange={handleFormChange("imageUrl")} />
      </Box>

      <Button variant="contained" onClick={createProduct} disabled={!canCreateProduct}>
        Create Product
      </Button>
    </Box>
  );

  // === Render ===
  return (
    <Container sx={{ mt: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Typography variant="h5" sx={{ flex: 1 }}>
          My Menu
        </Typography>
        {renderRestaurantStatus()}
      </Box>

      {/* Restaurant info */}
      {!restaurant && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You don't have a restaurant yet. Go to <strong>My Restaurant</strong> and create one. After admin approval, you can add items.
        </Alert>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Form */}
      {renderProductForm()}

      {/* Products */}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {products.map(renderProductCard)}
      </Grid>

      {/* Edit dialog */}
      <ProductEditDialog
        open={isEditDialogOpen}
        product={editingProduct}
        onClose={handleCloseEditDialog}
        onOptimistic={handleOptimisticUpdate}
        onSaved={handleProductSaved}
        onError={handleEditError}
      />

      {/* Loading indicator */}
      {isLoading && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="info">Loading…</Alert>
        </Box>
      )}
    </Container>
  );
}
