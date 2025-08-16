import { useEffect, useMemo, useState } from "react";
import api from "../utils/api";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Hero from "../components/Hero";
import ProductCard from "../components/ProductCard";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import MapInline, { type RestMarker } from "../components/MapInline";
import FiltersPanel, { type Filters } from "../components/FiltersPanel";
import { Link as RouterLink } from "react-router-dom";

type Product = {
  _id: string;
  name: string;
  price: number;
  category?: string;
  imageUrl?: string;
  description?: string;
};

type MetaResponse = {
  categories: string[];
  price: { min: number; max: number };
};

type ProductsResponse = {
  items: Product[];
};

const SIDEBAR_WIDTH = 280;

function FullBleed({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        position: "relative",
        left: "50%",
        right: "50%",
        marginLeft: "-50vw",
        marginRight: "-50vw",
        width: "100vw",
      }}
    >
      {children}
    </Box>
  );
}

export default function Home() {
  const [items, setItems] = useState<Product[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [mapOpen, setMapOpen] = useState(true);
  const [restaurants, setRestaurants] = useState<RestMarker[]>([]);
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);

  const [meta, setMeta] = useState<MetaResponse>({
    categories: [],
    price: { min: 0, max: 0 },
  });

  const [filters, setFilters] = useState<Filters>({
    search: "",
    categories: [],
    price: [0, 0],
    isAvailable: undefined,
  });

  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const queryParams = (restaurantId?: string) => {
    const p: Record<string, unknown> = { limit: 24, sort: "createdAt:desc" };
    if (restaurantId) p.restaurantId = restaurantId;
    if (filters.search) p.search = filters.search;
    if (filters.categories.length) p.categories = filters.categories.join(",");
    if (
      filters.price &&
      (filters.price[0] !== meta.price.min || filters.price[1] !== meta.price.max)
    ) {
      p.priceMin = filters.price[0];
      p.priceMax = filters.price[1];
    }
    if (filters.isAvailable !== undefined) p.isAvailable = filters.isAvailable;
    return p;
  };

  const loadProducts = async (restaurantId?: string) => {
    setErr("");
    setLoading(true);
    try {
      const { data } = await api.get<ProductsResponse>("/api/products", {
        params: queryParams(restaurantId),
      });
      setItems(data.items);
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Load failed");
    } finally {
      setLoading(false);
    }
  };

  const loadRestaurants = async () => {
    try {
      const { data } = await api.get<RestMarker[]>("/api/public/restaurants", {
        params: { approved: true, withCoords: true },
      });
      setRestaurants(data.filter((r) => r.lat != null && r.lng != null));
    } catch {
      /* silent */
    }
  };

  const loadMeta = async (restaurantId?: string) => {
    try {
      const { data } = await api.get<MetaResponse>("/api/products/meta", {
        params: { restaurantId },
      });
      const min = Number(data.price?.min ?? 0);
      const max = Number(data.price?.max ?? 0);
      setMeta({ categories: data.categories || [], price: { min, max } });
      setFilters((prev) => ({
        ...prev,
        price: [min, max],
        categories: prev.categories.filter((c) => data.categories.includes(c)),
      }));
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    loadProducts();
    loadRestaurants();
    loadMeta();
  }, []);

  useEffect(() => {
    loadProducts(selected?.id);
  }, [filters, selected]);

  const filteredTitle = useMemo(
    () => (selected ? `Popular Dishes — ${selected.name}` : "Popular Dishes"),
    [selected]
  );

  const clearRestaurantFilter = async () => {
    setSelected(null);
    await loadMeta();
    await loadProducts();
  };

  const handleSelectRestaurant = async (r: RestMarker) => {
    setSelected({ id: r._id, name: r.name });
    await loadMeta(r._id);
    await loadProducts(r._id);
  };

  const sidebar = (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        position: "sticky",
        top: 16,
        maxHeight: "calc(100vh - 32px)",
        overflow: "auto",
      }}
    >
      <FiltersPanel
        allCategories={meta.categories}
        priceMinMax={meta.price}
        value={filters}
        onChange={setFilters}
        onApply={() => loadProducts(selected?.id)}
        onReset={() => loadProducts(selected?.id)}
        disabled={loading}
        title="Filter"
      />
    </Box>
  );

  return (
    <>
      <Hero />
      <FullBleed>
        <Box sx={{ py: 2 }}>
          <Box
            sx={{
              display: { xs: "block", md: "grid" },
              gridTemplateColumns: { md: `${SIDEBAR_WIDTH}px 1fr` },
              alignItems: "start",
            }}
          >
            <Box
              sx={{
                borderRight: { md: 1 },
                borderColor: "divider",
                display: { xs: "none", md: "block" },
              }}
            >
              {sidebar}
            </Box>

            <Box sx={{ px: { xs: 2, md: 3 } }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1,
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                {!mdUp && (
                  <IconButton onClick={() => setDrawerOpen(true)} aria-label="filters">
                    <MenuIcon />
                  </IconButton>
                )}
                {selected && (
                  <Chip
                    label={`Restoran: ${selected.name}`}
                    onDelete={clearRestaurantFilter}
                    color="primary"
                    variant="outlined"
                    sx={{ ml: "auto" }}
                  />
                )}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1,
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <ButtonGroup variant="outlined" size="small">
                  <Button onClick={() => setMapOpen((v) => !v)}>
                    {mapOpen ? "Haritayı Gizle" : "Haritayı Göster"}
                  </Button>
                  <Button component={RouterLink} to="/map">
                    Tam ekran harita
                  </Button>
                </ButtonGroup>
              </Box>

              {mapOpen && (
                <Box sx={{ borderRadius: 2, overflow: "hidden", boxShadow: 3, mb: 3 }}>
                  <MapInline items={restaurants} onSelect={handleSelectRestaurant} />
                </Box>
              )}

              <Typography variant="h5" gutterBottom>
                {filteredTitle}
              </Typography>
              {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

              {loading ? (
                <Typography sx={{ mt: 2 }}>Loading…</Typography>
              ) : (
                <Grid container spacing={3}>
                  {items.map((p) => (
                    <Grid key={p._id} item xs={12} sm={6} md={6} lg={4} xl={4}>
                      <ProductCard product={p} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Box>

          <Drawer
            anchor="left"
            open={!mdUp && drawerOpen}
            onClose={() => setDrawerOpen(false)}
            PaperProps={{ sx: { width: SIDEBAR_WIDTH } }}
          >
            {sidebar}
          </Drawer>
        </Box>
      </FullBleed>
    </>
  );
}
