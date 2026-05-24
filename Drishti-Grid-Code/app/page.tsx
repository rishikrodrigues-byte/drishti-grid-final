import Link from "next/link";
import { Shield, Camera, Cpu, ArrowRight, Activity, Map } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-900/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Header */}
      <div className="text-center mb-16 z-10">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-xl border border-teal-500/30 bg-teal-500/10 flex items-center justify-center shadow-[0_0_30px_rgba(20,184,166,0.2)]">
            <Shield className="text-teal-400" size={32} />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-[0.2em] text-white uppercase mb-4">DRISHTI-GRID <span className="text-teal-500">2.0</span></h1>
        <p className="text-sm text-zinc-400 uppercase tracking-widest max-w-2xl mx-auto leading-relaxed">
          Autonomous Road Health Digital Twin & Contractor Accountability Platform
        </p>
        <div className="flex justify-center gap-3 mt-6">
          <span className="text-[10px] border border-zinc-800 bg-zinc-900 px-3 py-1 rounded text-zinc-300 uppercase tracking-widest font-bold">Google Gemini 3 Flash</span>
          <span className="text-[10px] border border-zinc-800 bg-zinc-900 px-3 py-1 rounded text-zinc-300 uppercase tracking-widest font-bold">SDG 9, 11, 12, 16</span>
        </div>
      </div>

      {/* The Two Portals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl z-10">
        
        {/* MOBILE EDGE SCANNER CARD */}
        <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-8 flex flex-col hover:border-green-500/50 transition-all duration-300 group shadow-lg">
          <div className="w-12 h-12 rounded border border-green-900/50 bg-green-950/30 flex items-center justify-center mb-6">
            <Camera className="text-green-500" size={24} />
          </div>
          <h2 className="text-xl font-bold text-white tracking-widest uppercase mb-2">The Edge Scanner</h2>
          <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest mb-4">Mobile IoT Infrastructure</p>
          <p className="text-xs text-zinc-400 leading-relaxed mb-8 flex-1">
            Designed to run on repurposed E-waste smartphones mounted on municipal vehicles. This module uses the Tri-Trigger engine and Gemini Vision AI to autonomously detect hazards and perform 3D Volume Estimation while driving.
          </p>
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest"><Cpu size={14}/> 1-Meter Spatial Deduplication</div>
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest"><Activity size={14}/> Live 3D Math Bounds</div>
          </div>
          
          {/* ADDED TARGET="_BLANK" TO OPEN IN NEW TAB */}
          <Link href="/scan" target="_blank" rel="noopener noreferrer" className="w-full bg-green-900/20 hover:bg-green-600 text-green-500 hover:text-white border border-green-900/50 hover:border-green-500 py-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all">
            Launch Edge Node <ArrowRight size={14} />
          </Link>
        </div>

        {/* PWD COMMAND CENTER CARD */}
        <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-8 flex flex-col hover:border-teal-500/50 transition-all duration-300 group shadow-lg">
          <div className="w-12 h-12 rounded border border-teal-900/50 bg-teal-950/30 flex items-center justify-center mb-6">
            <Map className="text-teal-500" size={24} />
          </div>
          <h2 className="text-xl font-bold text-white tracking-widest uppercase mb-2">PWD Command Center</h2>
          <p className="text-[10px] text-teal-500 font-bold uppercase tracking-widest mb-4">Government Dispatch Engine</p>
          <p className="text-xs text-zinc-400 leading-relaxed mb-8 flex-1">
            The central operations grid for city officials. It ingests live Edge Node data, clusters work orders by contractor jurisdiction, enforces SLA warranties, and prevents material fraud using a Live Weather-Material AI engine.
          </p>
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest"><Shield size={14}/> Closed-Loop AI Verification</div>
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest"><Map size={14}/> Smart Weather Dispatch</div>
          </div>
          
          {/* ADDED TARGET="_BLANK" TO OPEN IN NEW TAB */}
          <Link href="/dashboard" target="_blank" rel="noopener noreferrer" className="w-full bg-teal-900/20 hover:bg-teal-600 text-teal-500 hover:text-white border border-teal-900/50 hover:border-teal-500 py-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all">
            Launch Command Center <ArrowRight size={14} />
          </Link>
        </div>

      </div>
    </div>
  );
}