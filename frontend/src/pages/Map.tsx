import { useEffect, useMemo, useState } from "react";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import api from "../utils/api";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Marker ikon fix (Vite)
import iconUrl from "leaflet/dist/images/marker-icon.png";
import icon2xUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
(L.Icon.Default as unknown as { mergeOptions: (o: any) => void }).mergeOptions({
  iconUrl,
  iconRetinaUrl: icon2xUrl,
  shadowUrl,
});

type Rest = {
  _id: string;
  name: string;
  lat?: number | null;
  lng?: number | null;
  isApproved: boolean;
};

const ISTANBUL: [number, number] = [41.0082, 28.9784];

export default function MapPage() {
  const [items, setItems] = useState<Rest[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [center, setCenter] = useState<[number, number]>(ISTANBUL);
  const [zoom, setZoom] = useState(12);

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const { data } = await api.get<Rest[]>("/api/public/restaurants", {
        params: { approved: true, withCoords: true },
      });
      setItems(data.filter((r) => r.lat != null && r.lng != null));
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Failed to load restaurants.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const locate = () => {
    if (!navigator.geolocation) {
      setErr("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter([pos.coords.latitude, pos.coords.longitude]);
        setZoom(14);
      },
      (error) => {
        setErr(error.message || "Unable to retrieve your location.");
      }
    );
  };

  const hasAny = useMemo(() => items.length > 0, [items]);

  // Stabil key ile gerektiğinde temiz remount
  const mapKey = useMemo(
    () => `page-${items.length}-${center.join(",")}-${zoom}`,
    [items.length, center, zoom]
  );

  return (
    <Container sx={{ mt: 3, mb: 6 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5">Restaurants Map</Typography>
        <Stack direction="row" spacing={1}>
          <Button onClick={load} disabled={loading}>
            Refresh
          </Button>
          <Button variant="outlined" onClick={locate} disabled={loading}>
            Locate me
          </Button>
        </Stack>
      </Stack>

      {err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}

      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 520,
          }}
        >
          <CircularProgress />
        </Box>
      ) : !hasAny ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No restaurants found.
        </Alert>
      ) : (
        <Paper sx={{ p: 0, overflow: "hidden" }}>
          <Box sx={{ height: 520 }}>
            <MapContainer
              key={mapKey}
              center={center}
              zoom={zoom}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {items.map((r) => (
                <Marker
                  key={r._id}
                  position={[r.lat!, r.lng!] as [number, number]}
                >
                  <Popup>
                    <b>{r.name}</b>
                    <br />
                    lat: {r.lat?.toFixed(5)} / lng: {r.lng?.toFixed(5)}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </Box>
        </Paper>
      )}
    </Container>
  );
}
