"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { analyzeRoadImage } from "@/lib/ai";

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const addLog = (m: string) => setLogs(p => [`[${new Date().toLocaleTimeString()}] ${m}`, ...p].slice(0, 5));

  const runTrigger = useCallback(async (type: string) => {
    if (!videoRef.current || !canvasRef.current) return;
    addLog(`📸 Trigger: ${type}`);
    const ctx = canvasRef.current.getContext("2d");
    ctx?.drawImage(videoRef.current, 0, 0, 640, 480);
    const base64 = canvasRef.current.toDataURL("image/jpeg", 0.5);

    try {
      const diag = await analyzeRoadImage(base64);
      addLog(`✨ AI: ${diag.type} (Sev: ${diag.severity})`);

      const pos = await new Promise<GeolocationPosition>((res, rej) => 
        navigator.geolocation.getCurrentPosition(res, (err) => rej(err), { enableHighAccuracy: true })
      );

      await addDoc(collection(db, "reports"), { 
        ...diag, 
        image: base64, 
        lat: pos.coords.latitude, 
        lng: pos.coords.longitude, 
        trigger: type,
        timestamp: serverTimestamp() 
      });
      addLog(`✅ Cloud Sync Success`);
    } catch (error: unknown) { 
      // Safe error handling without using 'any'
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      addLog(`❌ Sync Failed: ${errorMessage}`); 
    }
  }, []);

  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsScanning(true);
      addLog("🚀 Sensor Engine Online");
    } catch (err: unknown) { 
      const errorMessage = err instanceof Error ? err.message : "Check permissions";
      addLog(`❌ Camera Denied: ${errorMessage}`); 
    }
  };

  useEffect(() => {
    if (!isScanning) return;
    const interval = setInterval(() => runTrigger("HEARTBEAT"), 15000);
    
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      const force = Math.sqrt((acc?.x||0)**2 + (acc?.y||0)**2 + (acc?.z||0)**2);
      if (force > 25) runTrigger("REFLEX");
    };

    window.addEventListener("devicemotion", handleMotion);
    return () => { 
      window.removeEventListener("devicemotion", handleMotion); 
      clearInterval(interval); 
    };
  }, [isScanning, runTrigger]);

  return (
    <div className="min-h-screen bg-black text-white p-6 font-mono flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-green-500 font-bold tracking-tighter uppercase">Drishti-Grid // Edge</h1>
        {isScanning && <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />}
      </div>
      
      <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-2xl border-2 border-zinc-800 mb-4 bg-zinc-900 aspect-video object-cover shadow-[0_0_20px_rgba(34,197,94,0.1)]" />
      <canvas ref={canvasRef} width="640" height="480" className="hidden" />
      
      <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex-1 overflow-hidden shadow-inner">
        <h2 className="text-[10px] text-zinc-500 uppercase mb-2 tracking-widest font-bold text-center border-b border-zinc-800 pb-2">Telemetry_Log_Stream</h2>
        <div className="space-y-1 mt-2">
          {logs.map((l, i) => (
            <div key={i} className="text-[10px] leading-tight text-zinc-300 border-l-2 border-green-800 pl-2 py-1 animate-in fade-in slide-in-from-left-2">
              {l}
            </div>
          ))}
          {logs.length === 0 && <p className="text-zinc-700 italic text-[10px]">Awaiting system initialization...</p>}
        </div>
      </div>

      {!isScanning ? (
        <button onClick={initCamera} className="w-full mt-4 bg-green-600 py-4 rounded-2xl font-bold uppercase tracking-widest text-sm active:scale-95 transition-transform">Init Sensor Node</button>
      ) : (
        <button onClick={() => runTrigger("MANUAL")} className="w-full mt-4 bg-zinc-800 py-4 rounded-2xl font-bold uppercase tracking-widest text-sm active:bg-zinc-700 transition-colors border border-zinc-700">Manual Audit</button>
      )}

      <div className="mt-6 flex justify-between opacity-30 text-[8px] uppercase tracking-tighter">
        <span>SDG 9.1 // INFRA</span>
        <span>SDG 11.2 // MOBILITY</span>
        <span>SDG 12.5 // CIRCULAR</span>
      </div>
    </div>
  );
}