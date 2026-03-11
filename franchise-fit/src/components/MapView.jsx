import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function milesToMeters(mi) {
  return Number(mi) * 1609.344;
}

function MapUpdater({ center, zoom }) {
  const map = useMap();
  const prevCenter = useRef(center);

  useEffect(() => {
    if (
      center[0] !== prevCenter.current[0] ||
      center[1] !== prevCenter.current[1]
    ) {
      map.flyTo(center, zoom, { duration: 1.2 });
      prevCenter.current = center;
    }
  }, [center, zoom, map]);

  return null;
}

export default function MapView({ center, zoom, radiusMi, popupText }) {
  const meters = milesToMeters(radiusMi);

  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={zoom}
        zoomControl={true}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          attribution="&copy; OpenStreetMap"
        />
        <MapUpdater center={center} zoom={zoom} />
        <Marker position={center}>
          {popupText && <Popup>{popupText}</Popup>}
        </Marker>
        <Circle
          center={center}
          radius={meters}
          pathOptions={{
            color: "#2563eb",
            weight: 2,
            fillOpacity: 0.14,
          }}
        />
      </MapContainer>
    </div>
  );
}
