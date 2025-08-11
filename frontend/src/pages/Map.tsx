import { useEffect, useMemo, useState } from "react";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import api from "../utils/api";

// leaflet
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Vite'da marker ikon fix'i
import iconUrl from "leaflet/dist/images/marker-icon.png";
import icon2xUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
(L.Icon.Default as any).mergeOptions({ iconUrl, iconRetinaUrl: icon2xUrl, shadowUrl });

type Rest = { _id: string; name: string; lat?: number | null; lng?: number | null; isApproved: boolean };

const ISTANBUL: [number, number] = [41.0082, 28.9784];

export default function MapPage() {
  const [items, setItems] = useState<Rest[]>([]);
  const [err, setErr] = useState("");
  const [center, setCenter] = useState<[number, number]>(ISTANBUL);
  const [zoom, setZoom] = useState(12);

  const load = async () => {
    setErr("");
    try {
      const { data } = await api.get<Rest[]>("/api/public/restaurants", { params: { approved: true, withCoords: true } });
      setItems(data);
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Load failed");
    }
  };

  useEffect(() => { load(); }, []);

  const locate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter([pos.coords.latitude, pos.coords.longitude]);
        setZoom(14);
      },
      () => {}
    );
  };

  const hasAny = useMemo(() => items && items.length > 0, [items]);

  return (
    <Container sx={{ mt: 3, mb: 6 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Restaurants Map</Typography>
        <Stack direction="row" spacing={1}>
          <Button onClick={load}>Refresh</Button>
          <Button variant="outlined" onClick={locate}>Locate me</Button>
        </Stack>
      </Stack>

      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

      <Paper sx={{ p: 0, overflow: "hidden" }}>
        <Box sx={{ height: 520 }}>
          <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {hasAny && items.map((r) => (
              <Marker key={r._id} position={[r.lat!, r.lng!] as [number, number]}>
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
    </Container>
  );
}
