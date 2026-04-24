"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

interface RoadReport {
  id: string;
  type: string;
  severity: number;
  repair_action: string;
  image: string;
  lat: number;
  lng: number;
  timestamp: Timestamp;
}

// Fixed line 20: Replaced <any> with a proper type definition
const MapComponent = dynamic<{ reports: RoadReport[] }>(
  () => import("@/app/dashboard/MapComponent"), 
  { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-zinc-900 flex items-center justify-center text-zinc-500 font-mono text-xs uppercase animate-pulse">Initializing_Geospatial_Engine...</div>
  }
);

export default function DashboardPage() {
  const [reports, setReports] = useState<RoadReport[]>([]);
  const [stats, setStats] = useState({ total: 0, critical: 0 });

  useEffect(() => {
    const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoadReport));
      setReports(data);
      setStats({
        total: data.length,
        critical: data.filter((r) => r.severity >= 4).length
      });
    });
    return () => unsub();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white font-mono">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
        <div>
          <h1 className="text-xl font-bold text-green-500 tracking-tighter uppercase">Drishti-Grid // Command</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Road Health Digital Twin</p>
        </div>
        <div className="flex gap-10">
          <div className="text-center"><p className="text-2xl">{stats.total}</p><p className="text-[9px] text-zinc-500 uppercase">Scans</p></div>
          <div className="text-center"><p className="text-2xl text-red-500">{stats.critical}</p><p className="text-[9px] text-zinc-500 uppercase">Critical</p></div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Real-time Side Feed */}
        <div className="w-80 border-r border-zinc-800 overflow-y-auto p-4 space-y-3">
          <h2 className="text-[10px] text-zinc-500 font-bold uppercase mb-4 tracking-widest">Live_Stream</h2>
          {reports.map((r) => (
            <div key={r.id} className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-all">
              <div className="flex justify-between items-center mb-2">
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${r.severity >= 4 ? 'bg-red-900/50 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>{r.type}</span>
                <span className="text-[9px] text-zinc-600">{r.timestamp?.toDate().toLocaleTimeString()}</span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {r.image && <img src={r.image} alt="Detection" className="w-full h-20 object-cover rounded-lg mb-2 grayscale" />}
              <p className="text-[10px] text-zinc-400 leading-tight line-clamp-2">{r.repair_action}</p>
            </div>
          ))}
          {reports.length === 0 && <p className="text-[10px] text-zinc-600 italic">Waiting for incoming telemetry...</p>}
        </div>

        {/* The Live Map */}
        <div className="flex-1 relative">
          <MapComponent reports={reports} />
        </div>
      </div>
    </div>
  );
}