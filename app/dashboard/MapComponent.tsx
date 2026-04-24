"use client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for missing icons
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Define the exact shape of the data the map expects
interface MapProps {
  reports: {
    id: string;
    type: string;
    severity: number;
    repair_action: string;
    image: string;
    lat: number;
    lng: number;
  }[];
}

export default function MapComponent({ reports }: MapProps) {
  return (
    <MapContainer center={[13.11, 74.92]} zoom={13} className="h-full w-full grayscale invert">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {reports.map((r) => (
        <Marker key={r.id} position={[r.lat, r.lng]} icon={DefaultIcon}>
          <Popup className="invert bg-white text-black rounded-xl">
            <div className="p-3 font-mono text-[10px]">
              <p className="font-bold uppercase text-red-600 mb-1">{r.type} (Sev: {r.severity})</p>
              <p className="mb-2 text-zinc-500">{r.repair_action}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.image} alt="Defect" className="w-40 rounded" />
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}