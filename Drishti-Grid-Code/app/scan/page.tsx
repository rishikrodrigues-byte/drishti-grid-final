"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, getDocs, updateDoc, doc } from "firebase/firestore";
import { analyzeRoadImage } from "@/lib/ai";
import { ShieldAlert, Activity, CheckCircle2, Cpu } from "lucide-react";

function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const p1 = lat1 * Math.PI/180, p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180, dl = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const[logs, setLogs] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [aiStatus, setAiStatus] = useState<"STANDBY" | "ANALYZING" | "VERIFIED" | "ALERT">("STANDBY");
  const scannedZones = useRef<{lat: number, lng: number}[]>([]);

  const addLog = (m: string) => setLogs(p => [`[${new Date().toLocaleTimeString()}] ${m}`, ...p].slice(0, 8));

  const runTrigger = useCallback(async function triggerProcess(type: string, isConfirmation = false) {
    if (!videoRef.current || !canvasRef.current) return;

    let pos: GeolocationPosition;
    try {
      pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true }));
    } catch { 
      addLog("❌ GPS Lock Pending..."); 
      return; 
    }

    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    if (!isConfirmation) {
      for (const zone of scannedZones.current) {
        if (getDistanceInMeters(lat, lng, zone.lat, zone.lng) < 1) {
          return; 
        }
      }
    }

    setAiStatus("ANALYZING");
    addLog(`📸 Frame Captured: ${type}`);
    const ctx = canvasRef.current.getContext("2d");
    ctx?.drawImage(videoRef.current, 0, 0, 640, 480);
    const base64 = canvasRef.current.toDataURL("image/jpeg", 0.5);

    try {
      const diag = await analyzeRoadImage(base64);
      if (diag.type === "error") { setAiStatus("STANDBY"); return; }

      const q = query(collection(db, "reports"));
      const snap = await getDocs(q);
      
      let nearbyResolvedId: string | null = null;
      let duplicateOpenId: string | null = null;

      snap.forEach((dDoc) => {
        const dData = dDoc.data();
        const dist = getDistanceInMeters(lat, lng, dData.lat, dData.lng);
        
        if (dist < 1) {
          if (dData.status === "RESOLVED") nearbyResolvedId = dDoc.id;
          if (dData.status === "OPEN") duplicateOpenId = dDoc.id;
        }
      });

      if (nearbyResolvedId) {
        if (diag.type === "normal") {
          await updateDoc(doc(db, "reports", nearbyResolvedId), { 
            status: "VERIFIED", 
            verifiedAt: serverTimestamp(),
            after_image: base64 
          });
          addLog("🛡️ FIX VERIFIED! Ledger updated.");
          setAiStatus("VERIFIED");
        } else {
          await updateDoc(doc(db, "reports", nearbyResolvedId), { 
            status: "OPEN", 
            failed_verification: true 
          });
          addLog("🚨 FAKE FIX REJECTED! Sent back to queue.");
          setAiStatus("ALERT");
        }
        setTimeout(() => setAiStatus("STANDBY"), 3000);
        return; 
      }

      if (diag.type !== "normal") {
        if (duplicateOpenId) {
           setAiStatus("STANDBY");
           return; 
        }
        
        addLog(`⚠️ DEFECT: ${diag.type.toUpperCase()} (Sev: ${diag.severity})`);
        setAiStatus("ALERT");
        scannedZones.current.push({ lat, lng });
        await addDoc(collection(db, "reports"), { 
          ...diag, image: base64, lat, lng, trigger: type, timestamp: serverTimestamp(), status: "OPEN", failed_verification: false
        });
        
        if (diag.severity >= 3 && !isConfirmation) {
          setTimeout(() => triggerProcess("HAZARD_CONFIRMATION", true), 2000); 
        }
        setTimeout(() => setAiStatus("STANDBY"), 3000);
      } else {
        setAiStatus("STANDBY");
      }

    } catch { 
      // Removed the unused 'error' variable here
      addLog("❌ Sync Error"); 
      setAiStatus("STANDBY"); 
    }
  },[]);

  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsScanning(true);
      addLog("🚀 M12 Optics Engine Online");
    } catch { 
      // Removed the unused 'err' variable here
      addLog("❌ Camera Denied"); 
    }
  };

  useEffect(() => {
    if (!isScanning) return;
    const interval = setInterval(() => runTrigger("HEARTBEAT"), 30000);
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      const force = Math.sqrt((acc?.x||0)**2 + (acc?.y||0)**2 + (acc?.z||0)**2);
      if (force > 25) runTrigger("REFLEX");
    };
    window.addEventListener("devicemotion", handleMotion);
    return () => { window.removeEventListener("devicemotion", handleMotion); clearInterval(interval); };
  },[isScanning, runTrigger]);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 p-6 font-mono flex flex-col relative overflow-hidden">
      
      <div className="flex justify-between items-center mb-6 z-10">
        <div>
          <h1 className="text-teal-500 font-bold uppercase tracking-widest text-sm flex items-center gap-2"><Cpu size={16}/> DRISHTI-GRID EDGE</h1>
          <p className="text-[9px] text-zinc-500 uppercase mt-1 tracking-[0.2em]">Vehicle ID: TRK-094 • Samsung M12</p>
        </div>
        {isScanning && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-900/30 bg-green-950/20">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-soft-pulse" />
            <span className="text-[9px] text-green-500 uppercase tracking-widest font-bold">GPS Locked</span>
          </div>
        )}
      </div>

      <div className="relative w-full rounded-xl border border-zinc-800 mb-6 aspect-[4/3] bg-black overflow-hidden shadow-2xl">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-90" />
        
        {isScanning && (
          <>
            <div className="absolute w-full h-1 bg-teal-500/80 shadow-[0_0_20px_rgba(20,184,166,1)] animate-scanline z-10" />
            
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-teal-500/50" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-teal-500/50" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-teal-500/50" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-teal-500/50" />
            
            <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
               <div className={`px-4 py-1.5 rounded backdrop-blur-md text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 transition-all ${
                 aiStatus === "ANALYZING" ? "bg-amber-500/20 text-amber-400 border border-amber-500/50" :
                 aiStatus === "VERIFIED" ? "bg-green-500/20 text-green-400 border border-green-500/50" :
                 aiStatus === "ALERT" ? "bg-red-500/20 text-red-400 border border-red-500/50" :
                 "bg-black/50 text-zinc-400 border border-zinc-700"
               }`}>
                 {aiStatus === "ANALYZING" && <Activity size={12} className="animate-spin" />}
                 {aiStatus === "VERIFIED" && <CheckCircle2 size={12} />}
                 {aiStatus === "ALERT" && <ShieldAlert size={12} />}
                 Gemini Engine: {aiStatus}
               </div>
            </div>
          </>
        )}
      </div>
      
      <canvas ref={canvasRef} width="640" height="480" className="hidden" />
      
      <div className="bg-[#0a0a0a] p-4 rounded-xl border border-zinc-800 flex-1 overflow-hidden flex flex-col relative z-10">
        <h2 className="text-[9px] text-zinc-500 uppercase mb-3 tracking-[0.2em] font-bold border-b border-zinc-800 pb-2">Sync Terminal</h2>
        <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
          {logs.map((l, i) => (
            <div key={i} className="text-[10px] leading-relaxed text-zinc-400 border-l-2 border-zinc-700 pl-3 py-0.5 font-sans transition-all opacity-80 hover:opacity-100">
              {l}
            </div>
          ))}
          {logs.length === 0 && <p className="text-[10px] text-zinc-600 italic">Awaiting sensor init...</p>}
        </div>
      </div>

      {!isScanning ? (
        <button onClick={initCamera} className="w-full mt-6 bg-teal-600 hover:bg-teal-500 transition-all py-4 rounded-xl font-bold uppercase tracking-widest text-xs text-white shadow-lg shadow-teal-900/20 z-10 relative">Initialize Sensor Array</button>
      ) : (
        <button onClick={() => runTrigger("MANUAL_OVERRIDE")} className="w-full mt-6 bg-zinc-900 hover:bg-amber-600 hover:text-white transition-all border border-zinc-800 hover:border-amber-500 py-4 rounded-xl font-bold uppercase tracking-widest text-xs text-zinc-400 z-10 relative">Manual Capture Override</button>
      )}
    </div>
  );
}