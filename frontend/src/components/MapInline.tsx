import { useMemo } from "react";
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

export interface RestaurantMarker {
  _id: string;
  name: string;
  lat: number;
  lng: number;
}

interface MapInlineProps {
  items: RestaurantMarker[];
  height?: number;
  center?: [number, number];
  onSelect?: (restaurant: RestaurantMarker) => void;
}

const DEFAULT_CENTER: [number, number] = [41.0082, 28.9784];

export default function MapInline({
  items,
  height = 360,
  center,
  onSelect,
}: MapInlineProps) {
  const hasMarkers = items?.length > 0;

  const mapCenter = useMemo<[number, number]>(() => {
    if (center) return center;
    if (hasMarkers) return [items[0].lat, items[0].lng];
    return DEFAULT_CENTER;
  }, [center, hasMarkers, items]);

  // Stabil key ile HMR/yeniden mount’larda temiz remount
  const mapKey = useMemo(
    () => `inline-${items?.[0]?._id ?? "empty"}`,
    [items]
  );

  return (
    <div style={{ height }}>
      <MapContainer
        key={mapKey}
        center={mapCenter}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {hasMarkers &&
          items.map((restaurant) => (
            <Marker
              key={restaurant._id}
              position={[restaurant.lat, restaurant.lng]}
            >
              <Popup>
                <div>
                  <strong>{restaurant.name}</strong>
                  {onSelect && (
                    <>
                      <br />
                      <button
                        type="button"
                        style={{
                          marginTop: 8,
                          cursor: "pointer",
                          padding: "4px 8px",
                          backgroundColor: "#1976d2",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                        }}
                        onClick={() => onSelect(restaurant)}
                      >
                        Bu restorana git
                      </button>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
