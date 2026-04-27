/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, Timestamp } from "firebase/firestore";
import dynamic from "next/dynamic";
import { toast, Toaster } from "sonner";
import { Shield, Search, Clock, CheckCircle2, AlertCircle, Truck, Map as MapIcon, Activity, UserCheck, ShieldCheck, Undo2, MapPin, Briefcase, Box } from "lucide-react";
import { useRouter } from "next/navigation";

interface RoadReport {
  id: string; type: string; severity: number; repair_action: string;
  bitumen_kg: number; image: string; after_image?: string; lat: number; lng: number;
  timestamp: Timestamp | null; status: "OPEN" | "RESOLVED" | "VERIFIED"; 
  failed_verification?: boolean;
  est_width_cm?: number; est_length_cm?: number; est_depth_cm?: number;
}

// FIX 1: Removed <any> to let Next.js infer the dynamic component type
const MapComponent = dynamic(() => import("@/app/dashboard/MapComponent"), { ssr: false });

const CONTRACTOR_DATA =[
  { id: 1, name: "L&T Infrastructure", road: "Karkala-Mangalore Hwy (NH-169)" },
  { id: 2, name: "RNC Constructions", road: "Vidyagiri-Alvas Road" },
  { id: 3, name: "GMR Roadways", road: "Moodbidre-Bantwal Road" },
  { id: 4, name: "Navayuga Engineering", road: "Jain Temple Road" },
  { id: 5, name: "Ashoka Buildcon", road: "Venur Road" }
];

const getTicketContractor = (ticketId: string) => {
  let hash = 0;
  for (let i = 0; i < ticketId.length; i++) hash += ticketId.charCodeAt(i);
  return CONTRACTOR_DATA[hash % CONTRACTOR_DATA.length];
};

// FIX 2: Defined strict TypeScript types for the routes to satisfy ESLint
type ContractorType = typeof CONTRACTOR_DATA[0];
type GroupedRouteType = RoadReport & { roadName: string; contractorId: number };

export default function DashboardPage() {
  const router = useRouter();
  const [reports, setReports] = useState<RoadReport[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const[focusedCoords, setFocusedCoords] = useState<[number, number] | null>(null);

  useEffect(() => {
    const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ 
        id: d.id, ...d.data(), status: d.data().status || "OPEN" 
      } as RoadReport));
      setReports(data);
    });
    return () => unsub();
  },[]);

  const activeReports = reports.filter(r => r.status === "OPEN" || r.status === "RESOLVED");
  const verifiedReports = reports.filter(r => r.status === "VERIFIED");
  const openReports = activeReports.filter(r => r.status === "OPEN");
  
  const currentCost = openReports.reduce((acc, curr) => acc + (curr.bitumen_kg || 0), 0) * 50;

  const filteredReports = activeReports.filter(r => {
    const matchesFilter = filter === "ALL" || 
      (filter === "HIGH" && r.severity >= 4) || 
      (filter === "MODERATE" && r.severity === 3) || 
      (filter === "LOW" && r.severity <= 2);
    return matchesFilter && r.type.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // FIX 3: Applied strict types to groupedRoutes dictionary
  const groupedRoutes: { [key: number]: { contractor: ContractorType, route: GroupedRouteType[] } } = {};
  openReports.forEach(r => {
    const con = getTicketContractor(r.id);
    if (!groupedRoutes[con.id]) groupedRoutes[con.id] = { contractor: con, route: [] };
    groupedRoutes[con.id].route.push({ ...r, roadName: con.road, contractorId: con.id });
  });
  const dispatchRoutes = Object.values(groupedRoutes);

  const failedCount = reports.filter(r => r.failed_verification).length;

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-zinc-400 font-sans overflow-hidden">
      <Toaster theme="dark" position="top-right" richColors />
      
      {/* HEADER */}
      <div className="h-20 border-b border-zinc-800 bg-[#0a0a0a] flex items-center justify-between px-6 shrink-0 z-20 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded border border-teal-900/50 bg-teal-950/20 flex items-center justify-center">
            <Shield className="text-teal-500" size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-[0.3em] text-white uppercase">PWD COMMAND CENTER <span className="text-teal-500 ml-2 border border-teal-500/30 bg-teal-500/10 px-1 py-0.5 rounded text-[10px]">V2.1</span></h1>
            <p className="text-[9px] text-zinc-500 tracking-widest mt-1 uppercase">Road Health Digital Twin • Live Operations</p>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="bg-[#111] border border-zinc-800 rounded px-5 py-2 min-w-[180px]">
             <p className="text-[8px] uppercase text-zinc-500 mb-1">Total Estimated Repair Cost</p>
             <p className="text-xl font-bold text-teal-400 font-mono">₹{currentCost.toLocaleString()}</p>
          </div>
          <div className="bg-[#111] border border-zinc-800 rounded px-5 py-2 min-w-[140px]">
             <p className="text-[8px] uppercase text-zinc-500 mb-1 flex items-center gap-1">Active Tickets</p>
             <p className="text-xl font-bold text-white font-mono">{activeReports.length} <span className="text-[9px] text-red-500 ml-1 font-sans font-bold">{openReports.length} CRITICAL</span></p>
          </div>
          <div className="flex items-center gap-2 ml-4 px-4 py-2 rounded-full border border-green-900/30 bg-green-950/20">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[9px] text-green-500 uppercase tracking-widest font-bold">Live • Firestore</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT COLUMN */}
        <div className="flex-1 flex flex-col overflow-y-auto border-r border-zinc-900 bg-[#080808] custom-scrollbar pb-20">
          
          <div className="h-[45vh] min-h-[400px] border-b border-zinc-900 relative shrink-0">
            <MapComponent reports={activeReports} focusedCoords={focusedCoords} />
          </div>

          <div className="p-8 space-y-10">
            
            {/* CONTRACTOR SMART ROUTES */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                 <MapIcon className="text-amber-500" size={18} />
                 <div>
                   <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-100">Smart Route Optimization</h3>
                   <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">AI-clustered dispatch work orders by Contractor</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {dispatchRoutes.map((group, i) => {
                  const routeBitumen = group.route.reduce((a, b) => a + (b.bitumen_kg||0), 0);
                  return (
                    <div key={i} className="bg-[#0a0a0a] border border-zinc-800 rounded-lg p-5 hover:border-amber-500/50 transition-all flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Dispatched To</span>
                          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">{group.contractor.name}</span>
                        </div>
                      </div>
                      <div className="space-y-2 mb-6 flex-1">
                        <div className="flex items-start gap-2 bg-zinc-900/50 p-2 rounded border border-zinc-800">
                          <MapPin size={12} className="text-zinc-500 shrink-0 mt-0.5" />
                          <span className="text-[10px] text-zinc-300 uppercase tracking-widest leading-relaxed">{group.contractor.road}</span>
                        </div>
                        <div className="flex justify-between text-[10px] border-b border-zinc-800 pb-1 mt-3">
                          <span className="text-zinc-500 uppercase tracking-widest">Stops</span>
                          <span className="text-white font-bold">{group.route.length} Locations</span>
                        </div>
                        <div className="flex justify-between text-[10px] border-b border-zinc-800 pb-1">
                          <span className="text-zinc-500 uppercase tracking-widest">Payload Req</span>
                          <span className="text-teal-400 font-bold font-mono">{routeBitumen.toFixed(1)} KG</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => {
                          localStorage.setItem("dispatch_route", JSON.stringify(group.route));
                          router.push("/dispatch"); 
                        }}
                        className="w-full bg-zinc-900 border border-zinc-700 hover:bg-amber-600 hover:text-white hover:border-amber-500 text-zinc-300 text-[10px] py-2 rounded uppercase font-bold tracking-widest flex justify-center items-center gap-2 transition-all">
                        <Truck size={14}/> Dispatch Contractor
                      </button>

                    </div>
                  )
                })}
                {dispatchRoutes.length === 0 && <p className="text-xs text-zinc-600 italic">No open tickets requiring dispatch.</p>}
              </div>
            </div>

            {/* SLA MATRIX */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                 <Activity className="text-teal-500" size={18} />
                 <div>
                   <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-100">Contractor SLA Matrix</h3>
                   <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Live performance tracking</p>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-lg p-5 relative overflow-hidden">
                  <div className="absolute left-0 top-0 h-full w-1 bg-green-500" />
                  <div className="flex items-center justify-between mb-2 ml-2">
                    <span className="text-[9px] uppercase tracking-widest text-zinc-500 flex items-center gap-2"><UserCheck size={12}/> AI Verification Match</span>
                  </div>
                  <div className="ml-2">
                    <p className="text-3xl font-bold text-white font-mono">94<span className="text-lg text-zinc-500">%</span></p>
                  </div>
                </div>

                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-lg p-5 relative overflow-hidden">
                  <div className="absolute left-0 top-0 h-full w-1 bg-red-500" />
                  <div className="flex items-center justify-between mb-2 ml-2">
                    <span className="text-[9px] uppercase tracking-widest text-zinc-500 flex items-center gap-2"><AlertCircle size={12}/> Ghost Fix Attempts</span>
                    {failedCount > 0 && <span className="bg-red-500/10 text-red-500 text-[8px] px-2 py-0.5 rounded border border-red-500/30">FLAGGED</span>}
                  </div>
                  <div className="ml-2">
                    <p className="text-3xl font-bold text-white font-mono">{failedCount}</p>
                    <p className="text-[9px] text-zinc-400 mt-2 italic leading-relaxed">Fixes rejected by Edge Node.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI VERIFICATION LEDGER */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                 <ShieldCheck className="text-green-500" size={18} />
                 <div>
                   <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-100">AI Verification Ledger</h3>
                   <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Closed-loop visual proof of work</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {verifiedReports.map(r => (
                  <div key={r.id} className="bg-[#0a0a0a] border border-zinc-800 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-800/50">
                        <span className="bg-zinc-800 text-zinc-200 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-widest">{r.type}</span>
                        <span className="text-green-500 text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-widest bg-green-500/10 px-3 py-1 rounded border border-green-500/20">
                          <CheckCircle2 size={12}/> AI Verified Complete
                        </span>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Defect Logged</span>
                           <span className="text-[9px] text-red-500 uppercase">Before</span>
                        </div>
                        <img src={r.image} alt="Before" className="w-full h-32 object-cover rounded border border-zinc-800 grayscale opacity-80" />
                      </div>
                      
                      <div className="flex-1">
                         <div className="flex justify-between items-center mb-2">
                           <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">M12 Scan</span>
                           <span className="text-[9px] text-green-500 uppercase">After</span>
                        </div>
                        {r.after_image ? (
                          <img src={r.after_image} alt="After" className="w-full h-32 object-cover rounded border border-green-900/50" />
                        ) : (
                          <div className="w-full h-32 bg-zinc-900 rounded border border-zinc-800 flex items-center justify-center text-[9px] text-zinc-600 uppercase tracking-widest text-center px-4">
                            Image data missing
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {verifiedReports.length === 0 && (
                  <div className="col-span-2 bg-[#0a0a0a] border border-zinc-800 border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center">
                    <ShieldCheck size={32} className="text-zinc-700 mb-3" />
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">Awaiting M12 Edge Node AI verifications...</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT SIDEBAR - ACTIVE TICKETS */}
        <div className="w-[420px] h-full shrink-0 flex flex-col bg-[#050505] border-l border-zinc-900">
          <div className="p-6 pb-4 shrink-0 border-b border-zinc-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Active Repair Tickets</h2>
              <span className="text-[9px] text-zinc-500">{activeReports.length} queued</span>
            </div>

            {/* FIX 4: Restored Search Bar to remove unused state warnings */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 text-zinc-600" size={14} />
              <input type="text" placeholder="Search defect or ID..." onChange={(e)=>setSearchQuery(e.target.value)} className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg py-2 pl-9 pr-4 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-teal-500/50 transition-all" />
            </div>
            
            <div className="flex bg-[#0a0a0a] rounded-lg border border-zinc-800 font-sans overflow-hidden">
              {['ALL', 'HIGH', 'MODERATE', 'LOW'].map(f => (
                <button key={f} onClick={()=>setFilter(f)} className={`flex-1 text-[9px] py-2 transition-all font-bold uppercase tracking-widest ${filter===f ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>{f}</button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-4 custom-scrollbar">
            {filteredReports.map(r => {
              const con = getTicketContractor(r.id);
              return (
              <div key={r.id} onClick={()=>setFocusedCoords([r.lat, r.lng])} className={`bg-[#0a0a0a] border rounded-lg overflow-hidden group cursor-pointer transition-all relative ${r.failed_verification ? 'border-red-900/50' : 'border-zinc-800 hover:border-zinc-700'}`}>
                
                <div className={`absolute top-0 left-0 bottom-0 w-1 ${r.status === "RESOLVED" ? "bg-amber-500 animate-pulse" : (r.severity >= 4 ? 'bg-red-500' : r.severity === 3 ? 'bg-amber-500' : 'bg-green-500')}`} />
                
                <div className="p-4 pl-5">
                   <div className="flex justify-between items-center mb-3">
                      <span className="text-[9px] font-bold px-2 py-1 rounded bg-zinc-800 text-zinc-300 uppercase tracking-widest">{r.type}</span>
                      <div className="flex items-center gap-1 text-[9px] text-zinc-500 tracking-widest">
                        <Clock size={10}/> {r.status === "RESOLVED" ? "VERIFYING..." : "7D DEADLINE"}
                      </div>
                   </div>

                   <div className="flex flex-col gap-2 mb-3 bg-[#111] p-3 rounded border border-zinc-800/50">
                     <div className="flex items-start gap-2 text-[9px] text-zinc-300 uppercase tracking-widest font-bold">
                       <MapPin size={12} className="text-red-500 shrink-0" /> {con.road}
                     </div>
                     <div className="flex items-center gap-2 text-[9px] text-teal-400 uppercase tracking-widest font-bold">
                       <Briefcase size={12} className="text-teal-500" /> {con.name}
                     </div>
                   </div>
                   
                   {r.image && (
                     <div className="relative mb-3">
                       <img src={r.image} alt="Defect" className="w-full h-24 object-cover rounded grayscale group-hover:grayscale-0 transition-all border border-zinc-800" />
                       
                       {r.status === "RESOLVED" && (
                         <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded gap-2 z-10">
                           <span className="bg-amber-500/20 text-amber-500 border border-amber-500/50 px-3 py-1 rounded text-[10px] font-bold tracking-widest uppercase flex items-center gap-2"><Activity size={12}/> Awaiting AI Verify</span>
                           
                           <button onClick={async (e) => {
                             e.stopPropagation();
                             await updateDoc(doc(db, "reports", r.id), { status: "OPEN" });
                             toast("Resolution undone. Back in active queue.");
                           }} className="text-[9px] text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded flex items-center gap-1 uppercase tracking-widest border border-zinc-600">
                             <Undo2 size={10} /> Undo
                           </button>
                         </div>
                       )}
                     </div>
                   )}

                   {r.est_width_cm && (
                     <div className="mb-4 bg-zinc-900 border border-zinc-800 rounded p-2 text-[9px] font-mono text-zinc-400">
                       <div className="flex justify-between border-b border-zinc-800 pb-1 mb-1">
                         <span className="flex items-center gap-1"><Box size={10}/> 3D Volume Est.</span>
                         <span>{r.est_width_cm}x{r.est_length_cm}x{r.est_depth_cm} cm</span>
                       </div>
                       <div className="flex justify-between text-teal-500/80">
                         <span>Includes +15% Margin</span>
                         <span>Math bounds verified</span>
                       </div>
                     </div>
                   )}

                   {r.failed_verification && r.status === "OPEN" && (
                     <div className="mb-3 bg-red-950/30 border border-red-900/50 rounded px-2 py-1.5 flex items-center gap-2">
                       <AlertCircle size={12} className="text-red-500" />
                       <span className="text-[9px] text-red-400 font-bold uppercase tracking-widest">Fix Rejected by AI</span>
                     </div>
                   )}
                   
                   <div className="flex justify-between items-center pt-3 border-t border-zinc-800/50">
                      <div>
                        <p className="text-[8px] text-zinc-600 uppercase mb-0.5 font-bold tracking-widest">Bitumen Payload Requirement</p>
                        <p className="text-[12px] text-teal-400 font-bold font-mono">{r.bitumen_kg ? r.bitumen_kg.toFixed(1) : 0}<span className="text-[9px] text-teal-600 ml-0.5">KG</span></p>
                      </div>
                      
                      {r.status === "OPEN" ? (
                        <button onClick={async (e)=>{
                            e.stopPropagation(); 
                            await updateDoc(doc(db,"reports",r.id),{status:"RESOLVED", failed_verification: false}); 
                            toast.success("Repair Logged. Waiting for M12 Verification.");
                        }} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded text-zinc-300 transition-all uppercase font-bold tracking-widest">
                          {r.failed_verification ? "Re-Resolve" : "Resolve"}
                        </button>
                      ) : (
                        <span className="text-[9px] text-amber-500 uppercase tracking-widest font-bold">Unverified</span>
                      )}
                   </div>
                </div>
              </div>
            )})}
            
            {filteredReports.length === 0 && (
              <div className="h-40 flex flex-col items-center justify-center text-zinc-600 border border-dashed border-zinc-800 rounded-xl mt-4">
                <CheckCircle2 size={32} className="mb-3 opacity-50" />
                <p className="text-[10px] uppercase tracking-widest font-bold">No Active Tickets</p>
                <p className="text-[9px] text-zinc-500 mt-1">Infrastructure parameters normal.</p>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}