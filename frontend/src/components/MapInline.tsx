import { useMemo } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Vite için marker icon fix
import iconUrl from "leaflet/dist/images/marker-icon.png";
import icon2xUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
(L.Icon.Default as any).mergeOptions({
  iconUrl,
  iconRetinaUrl: icon2xUrl,
  shadowUrl,
});

export type RestMarker = {
  _id: string;
  name: string;
  lat: number;
  lng: number;
};

const DEFAULT_CENTER: [number, number] = [41.0082, 28.9784]; // İstanbul

export default function MapInline({
  items,
  height = 360,
  center,
  onSelect,
}: {
  items: RestMarker[];
  height?: number;
  center?: [number, number];
  onSelect?: (r: RestMarker) => void;
}) {
  const hasAny = items?.length > 0;
  const c = useMemo<[number, number]>(() => {
    if (center) return center;
    if (hasAny) return [items[0].lat, items[0].lng];
    return DEFAULT_CENTER;
  }, [center, hasAny, items]);

  return (
    <div style={{ height }}>
      <MapContainer
        center={c}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasAny &&
          items.map((r) => (
            <Marker key={r._id} position={[r.lat, r.lng] as [number, number]}>
              <Popup>
                <b>{r.name}</b>
                <br />
                <button
                  style={{ marginTop: 6, cursor: "pointer" }}
                  onClick={() => onSelect?.(r)}
                >
                  Bu restorana git
                </button>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
