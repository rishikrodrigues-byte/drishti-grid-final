"use client";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

// Red icon to match the destination pin style in your screenshot 
// and to clearly indicate a "defect" on a light map.
const DefectIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapController({ focusedCoords }: { focusedCoords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (focusedCoords) map.flyTo(focusedCoords, 18, { animate: true, duration: 1.5 });
  },[focusedCoords, map]);
  return null;
}

export default function MapComponent({ reports, focusedCoords }: { reports: any[], focusedCoords: [number, number] | null }) {
  // Sort by timestamp to draw the path line sequentially
  const pathPositions: [number, number][] = [...reports]
    .sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0))
    .map(r => [r.lat, r.lng]);

  return (
    <MapContainer center={[13.0515, 74.9647]} zoom={13} className="h-full w-full bg-white">
      
      {/* 1. LIGHT THEME GOOGLE MAPS TILES (Matches your screenshot perfectly) */}
      <TileLayer 
        url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" 
        attribution='&copy; Google Maps'
      />
      
      {/* 2. THICK NEON GREEN SOLID LINE (Matches the routing line in your screenshot) */}
      <Polyline 
        positions={pathPositions} 
        color="#39FF14" // Bright neon green
        weight={6}      // Thick line
        opacity={0.8}   // Solid appearance
      />
      
      <MapController focusedCoords={focusedCoords} />
      
      {reports.map((r) => (
        <Marker key={r.id} position={[r.lat, r.lng]} icon={DefectIcon}>
          <Popup className="light-popup">
            <div className="text-zinc-900 font-sans text-[10px] p-1">
              <p className="font-bold uppercase text-red-600 mb-1">{r.type}</p>
              <p className="font-mono text-[9px] text-zinc-600 mb-2">{r.lat.toFixed(4)}, {r.lng.toFixed(4)}</p>
              <img src={r.image} alt="Defect" className="w-32 rounded mt-1 shadow-sm" />
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}