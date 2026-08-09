import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const ROAD_COORDINATES = {
  "NH-24": [28.6139, 77.2900],
  "Ring Road": [28.5729, 77.2094],
  "MG Road": [28.4817, 77.0873],
  "Outer Ring Road": [28.5355, 77.3910],
};

const COLOR = { Low: "#22c55e", Medium: "#f59e0b", High: "#ef4444" };

export default function TrafficMap({ liveData = [] }) {
  return (
    <MapContainer center={[28.6139, 77.2090]} zoom={11} style={{ height: "400px", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
      {liveData.map((road) => {
        const coords = ROAD_COORDINATES[road.road_name];
        if (!coords) return null;
        return (
          <CircleMarker
            key={road.road_name}
            center={coords}
            radius={12}
            pathOptions={{ color: COLOR[road.congestion_level] || "#888", fillOpacity: 0.6 }}
          >
            <Popup>
              <strong>{road.road_name}</strong><br />
              Speed: {road.average_speed} km/h<br />
              Congestion: {road.congestion_level}
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
