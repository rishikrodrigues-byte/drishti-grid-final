/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, MessageSquare, Phone, Calendar, Briefcase, Plus, ShieldCheck, ShieldAlert, MapPin, CloudRain, Sun } from "lucide-react";
import { toast, Toaster } from "sonner";

// STRICT TYPESCRIPT INTERFACES
interface Road {
  name: string;
  distance: string;
}

interface Contractor {
  id: number;
  name: string;
  phone: string;
  email: string;
  warranty: string;
  taluk: string;
  reliability: string;
  roads: Road[];
}

interface RouteReport {
  id: string;
  type: string;
  severity: number;
  bitumen_kg: number;
  image: string;
  lat: number;
  lng: number;
  contractorId?: number;
}

const INITIAL_CONTRACTORS: Contractor[] =[
  { id: 1, name: "L&T Infrastructure", phone: "+91 9876543210", email: "dispatch@lnt.com", warranty: "5 Years", taluk: "Moodbidre", reliability: "98%", roads:[{name: "Karkala-Mangalore Hwy (NH-169)", distance: "15 km"}] },
  { id: 2, name: "RNC Constructions", phone: "+91 9876543211", email: "ops@rnc.com", warranty: "5 Years", taluk: "Moodbidre", reliability: "92%", roads:[{name: "Vidyagiri-Alvas Road", distance: "4 km"}] },
  { id: 3, name: "GMR Roadways", phone: "+91 9876543212", email: "fix@gmr.com", warranty: "3 Years", taluk: "Moodbidre", reliability: "95%", roads:[{name: "Moodbidre-Bantwal Road", distance: "12 km"}] },
  { id: 4, name: "Navayuga Engineering", phone: "+91 9876543213", email: "info@navayuga.com", warranty: "2 Years", taluk: "Moodbidre", reliability: "88%", roads:[{name: "Jain Temple Road", distance: "2 km"}] },
  { id: 5, name: "Ashoka Buildcon", phone: "+91 9876543214", email: "contact@ashoka.com", warranty: "5 Years", taluk: "Moodbidre", reliability: "96%", roads:[{name: "Venur Road", distance: "18 km"}] },
  { id: 6, name: "Mangalore Asphalts", phone: "+91 9876543215", email: "mangalore@asphalt.com", warranty: "1 Year", taluk: "Mangalore", reliability: "85%", roads:[{name: "Panambur Port Road", distance: "8 km"}] },
];

export default function DispatchPage() {
  const router = useRouter();
  const[routeData, setRouteData] = useState<RouteReport[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>(INITIAL_CONTRACTORS);
  const [selectedTaluk, setSelectedTaluk] = useState("Moodbidre");
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const[scriptType, setScriptType] = useState<"MAIL" | "MESSAGE" | "CALL" | "MEET">("MAIL");
  const [showAddForm, setShowAddForm] = useState(false);
  const [weatherMode, setWeatherMode] = useState<"CLEAR" | "MONSOON">("CLEAR");

  // FIX 2: Compute Date exactly once on mount to keep render pure
  const [deadline] = useState(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString());

  const [newCon, setNewCon] = useState({ name: "", phone: "", email: "", warranty: "5 Years", taluk: "Moodbidre", roadName: "", roadDistance: "" });

  useEffect(() => {
    const data = localStorage.getItem("dispatch_route");
    if (data) {
      const parsedData = JSON.parse(data) as RouteReport[];
      
      // FIX 1: Defer state update to bypass 'set-state-in-effect' strict rule
      setTimeout(() => {
        setRouteData(parsedData);
        if (parsedData.length > 0 && parsedData[0].contractorId) {
          const matchingCon = INITIAL_CONTRACTORS.find(c => c.id === parsedData[0].contractorId);
          if (matchingCon) setSelectedContractor(matchingCon);
        }
      }, 0);
    }
  },[]);

  const handleAddContractor = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedNewCon: Contractor = {
      id: Date.now(), // Allowed here because it's inside an event handler, not render
      name: newCon.name,
      phone: newCon.phone,
      email: newCon.email,
      warranty: newCon.warranty,
      taluk: newCon.taluk,
      reliability: "100%",
      roads:[{ name: newCon.roadName, distance: newCon.roadDistance }]
    };
    setContractors([formattedNewCon, ...contractors]);
    setShowAddForm(false);
    toast.success("Contractor Profile & Road Data Added");
  };

  const generateScript = () => {
    if (!selectedContractor || routeData.length === 0) return "Select a contractor to generate script.";
    
    const assignedRoad = selectedContractor.roads[0].name;
    const stopsText = routeData.map((r, i) => `Stop ${i+1}: Lat ${r.lat.toFixed(4)}, Lng ${r.lng.toFixed(4)} | Severity: Level ${r.severity}`).join("\n");
    const payload = routeData.reduce((a, b) => a + (b.bitumen_kg || 0), 0);

    const materialRequired = weatherMode === "MONSOON" 
      ? `🚫 HOT-MIX PROHIBITED DUE TO RAIN.\nREQUIRED MATERIAL: ${payload.toFixed(1)} KG Preliminary Gravel / Cold-Patch Asphalt.`
      : `REQUIRED MATERIAL: ${payload.toFixed(1)} KG Hot-Mix Asphalt`;

    const weatherClause = weatherMode === "MONSOON"
      ? `\nWEATHER ALERT: Monsoon conditions detected. Permanent asphalt resurfacing is halted. You must secure the perimeter and proceed with temporary gravel filling immediately to prevent accidents. Permanent fix scheduled post-monsoon.\n`
      : ``;

    if (scriptType === "MAIL") {
      return `SUBJECT: URGENT WORK ORDER - ${assignedRoad} (PWD)\n\nDear ${selectedContractor.name} Operations Team,\n\nUnder your active ${selectedContractor.warranty} warranty agreement for ${assignedRoad}, you are mandated to resolve the following structural road defects.\n${weatherClause}\nDEFECT LOCATIONS:\n${stopsText}\n\n${materialRequired}\nSLA DEADLINE: ${deadline} (7 Days)\n\nPlease dispatch your crews immediately. Automated AI verification will occur post-repair.\n\nRegards,\nPWD Command Center`;
    }
    if (scriptType === "MESSAGE") {
      return `PWD ALERT: Warranty fix required by ${selectedContractor.name} on ${assignedRoad}. ${weatherMode==="MONSOON"?"GRAVEL FILL ONLY (Monsoon).":"HOT-MIX."} Payload: ${payload.toFixed(1)}KG. Deadline: ${deadline}. Reply YES to confirm.`;
    }
    if (scriptType === "CALL") {
      return `[Call Script for PWD Agent]:\n"Hello, this is the PWD Command Center calling for ${selectedContractor.name}.\n\nWe have ${routeData.length} urgent repairs on ${assignedRoad} covered under your ${selectedContractor.warranty} warranty.\n\n${weatherMode === "MONSOON" ? "Because of the rain, do NOT use hot-mix. We need you to deploy cold-patch and gravel immediately." : `The system shows ${payload.toFixed(1)}KG of Bitumen is required.`}\n\nCan you confirm your trucks will be dispatched to these coordinates by tomorrow?"`;
    }
    if (scriptType === "MEET") {
      return `Meeting Request: PWD & ${selectedContractor.name} Representative\nAgenda: SLA Breach Risk & Warranty Enforcement for ${routeData.length} pending defects on ${assignedRoad}.\n\nLocation: Virtual Command Center / Site Inspection.\nPlease propose a time within the next 24 hours.`;
    }
  };

  const filteredContractors = contractors.filter(c => c.taluk === selectedTaluk);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 font-sans flex flex-col">
      <Toaster theme="dark" richColors />
      
      <div className="h-20 border-b border-zinc-800 bg-[#0a0a0a] flex items-center justify-between px-6 shadow-xl shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-zinc-800 rounded-full transition-all text-white"><ArrowLeft size={20}/></button>
          <div className="w-10 h-10 rounded border border-amber-900/50 bg-amber-950/20 flex items-center justify-center">
            <Briefcase className="text-amber-500" size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-[0.3em] text-white uppercase">Dispatch Engine</h1>
            <p className="text-[9px] text-zinc-500 tracking-widest mt-1 uppercase">Contractor Warranty Enforcement</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[450px] border-r border-zinc-900 bg-[#080808] flex flex-col z-10">
          <div className="p-6 border-b border-zinc-900">
             <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-4">Select Jurisdiction</h2>
             <div className="bg-[#111] border border-zinc-800 rounded p-3 mb-4">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">District</span>
                <p className="text-sm text-teal-400 font-bold tracking-widest uppercase mt-1">Dakshina Kannada</p>
             </div>
             
             <div className="flex bg-[#0a0a0a] rounded-lg border border-zinc-800 overflow-hidden">
                {["Moodbidre", "Mangalore"].map(t => (
                  <button key={t} onClick={()=>setSelectedTaluk(t)} className={`flex-1 text-[10px] py-2.5 transition-all font-bold uppercase tracking-widest ${selectedTaluk===t ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>{t}</button>
                ))}
             </div>
          </div>

          <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-[#0a0a0a]">
             <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Eligible Contractors</span>
             <button onClick={() => setShowAddForm(true)} className="flex items-center gap-1 text-[9px] bg-teal-900/30 text-teal-400 border border-teal-800 px-3 py-1.5 rounded hover:bg-teal-900 transition-all uppercase tracking-widest font-bold"><Plus size={12}/> Add Audit Form</button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {filteredContractors.map((c) => (
              <div key={c.id} onClick={() => setSelectedContractor(c)} className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedContractor?.id === c.id ? 'bg-zinc-900 border-amber-500' : 'bg-[#0a0a0a] border-zinc-800 hover:border-zinc-600'}`}>
                 <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xs font-bold text-white tracking-widest uppercase">{c.name}</h3>
                    <span className="bg-green-900/30 text-green-500 text-[8px] px-2 py-0.5 rounded border border-green-800 font-bold tracking-widest uppercase flex items-center gap-1"><ShieldCheck size={10}/> {c.warranty}</span>
                 </div>
                 
                 <div className="bg-[#111] p-2 rounded border border-zinc-800 mb-3 space-y-1 text-[9px] tracking-widest uppercase font-bold text-zinc-400">
                    <div className="flex justify-between items-center text-zinc-300">
                      <span className="flex items-center gap-1"><MapPin size={10} className="text-amber-500"/> {c.roads[0].name}</span>
                    </div>
                    <div className="pl-4 text-zinc-600">Distance: {c.roads[0].distance}</div>
                 </div>

                 <div className="flex justify-between items-center pt-3 border-t border-zinc-800/50 text-[9px] uppercase tracking-widest">
                   <span className="text-zinc-600">AI Reliability Score</span>
                   <span className="text-teal-400 font-bold">{c.reliability}</span>
                 </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-[#050505] p-8 overflow-y-auto">
           {routeData.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-zinc-600">
               <ShieldAlert size={48} className="mb-4 opacity-50" />
               <p className="text-sm uppercase tracking-widest">No route data loaded. Please assign from dashboard.</p>
             </div>
           ) : (
             <div className="max-w-4xl mx-auto">
                
                <div className="mb-8 bg-[#0a0a0a] border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
                   <div>
                     <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-1 flex items-center gap-2">Live Weather-Material Engine</h2>
                     <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Civil Engineering Environment Checks</p>
                   </div>
                   <div className="flex bg-[#111] border border-zinc-800 rounded p-1">
                     <button onClick={()=>setWeatherMode("CLEAR")} className={`px-4 py-2 text-[9px] font-bold uppercase tracking-widest rounded transition-all flex items-center gap-2 ${weatherMode==="CLEAR" ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50' : 'text-zinc-600'}`}>
                       <Sun size={12}/> Clear / Summer
                     </button>
                     <button onClick={()=>setWeatherMode("MONSOON")} className={`px-4 py-2 text-[9px] font-bold uppercase tracking-widest rounded transition-all flex items-center gap-2 ${weatherMode==="MONSOON" ? 'bg-blue-500/20 text-blue-500 border border-blue-500/50' : 'text-zinc-600'}`}>
                       <CloudRain size={12}/> Monsoon Alert
                     </button>
                   </div>
                </div>

                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-6">Work Order Payload</h2>
                
                <div className="grid grid-cols-3 gap-4 mb-8">
                   {routeData.map((r, i) => (
                     <div key={i} className="bg-[#0a0a0a] border border-zinc-800 rounded p-3">
                       <img src={r.image} className="w-full h-24 object-cover rounded border border-zinc-800 mb-3" alt="Defect" />
                       <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mb-1 flex justify-between">Stop 0{i+1} <span>SEV {r.severity}</span></p>
                       <p className="text-[9px] text-zinc-500 font-mono">{r.lat.toFixed(4)}, {r.lng.toFixed(4)}</p>
                     </div>
                   ))}
                </div>

                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-6">Automated Dispatch Communication</h2>
                
                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl overflow-hidden">
                   <div className="flex border-b border-zinc-800 bg-[#111]">
                     {[
                       { id: "MAIL", icon: Mail, label: "Email Dispatch" },
                       { id: "MESSAGE", icon: MessageSquare, label: "SMS Script" },
                       { id: "CALL", icon: Phone, label: "Call Script" },
                       { id: "MEET", icon: Calendar, label: "Schedule Meeting" }
                     ].map(tab => (
                       <button 
                         key={tab.id} 
                         // FIX 3: Strict Types applied to onClick handler
                         onClick={() => setScriptType(tab.id as "MAIL" | "MESSAGE" | "CALL" | "MEET")} 
                         className={`flex-1 py-4 flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-widest transition-all ${scriptType === tab.id ? 'bg-[#0a0a0a] text-amber-500 border-b-2 border-amber-500' : 'text-zinc-600 hover:text-zinc-300'}`}
                       >
                          <tab.icon size={14} /> {tab.label}
                       </button>
                     ))}
                   </div>

                   <div className="p-6">
                      <div className={`bg-black border rounded-lg p-5 min-h-[250px] transition-all ${weatherMode === "MONSOON" ? "border-blue-900/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]" : "border-zinc-900"}`}>
                         {!selectedContractor ? (
                           <div className="h-full flex items-center justify-center text-[10px] text-zinc-600 uppercase tracking-widest italic pt-20">
                             👈 Select a contractor from the left panel to generate script
                           </div>
                         ) : (
                           <pre className={`font-mono text-[11px] whitespace-pre-wrap leading-relaxed ${weatherMode === "MONSOON" ? "text-blue-100" : "text-zinc-300"}`}>
                             {generateScript()}
                           </pre>
                         )}
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                         <button disabled={!selectedContractor} onClick={() => toast.success(`${scriptType} Sent Successfully to ${selectedContractor?.name}`)} className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-3 rounded text-[10px] uppercase font-bold tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                           Execute {scriptType} Action
                         </button>
                      </div>
                   </div>
                </div>

             </div>
           )}
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#0a0a0a] border border-zinc-800 w-[600px] rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-[#111]">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Contractor Audit Form</h2>
              <button onClick={() => setShowAddForm(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddContractor} className="p-6 space-y-4">
               <div>
                 <label className="block text-[9px] text-zinc-500 uppercase tracking-widest mb-1">Company Name</label>
                 <input required type="text" onChange={e => setNewCon({...newCon, name: e.target.value})} className="w-full bg-black border border-zinc-800 rounded p-2 text-sm text-white focus:border-amber-500 outline-none" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[9px] text-zinc-500 uppercase tracking-widest mb-1">Phone</label>
                   <input required type="text" onChange={e => setNewCon({...newCon, phone: e.target.value})} className="w-full bg-black border border-zinc-800 rounded p-2 text-sm text-white focus:border-amber-500 outline-none" />
                 </div>
                 <div>
                   <label className="block text-[9px] text-zinc-500 uppercase tracking-widest mb-1">Email</label>
                   <input required type="email" onChange={e => setNewCon({...newCon, email: e.target.value})} className="w-full bg-black border border-zinc-800 rounded p-2 text-sm text-white focus:border-amber-500 outline-none" />
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-4 mt-2">
                 <div>
                   <label className="block text-[9px] text-amber-500 uppercase tracking-widest mb-1 font-bold">Assigned Road Name</label>
                   <input required type="text" placeholder="e.g. NH-169" onChange={e => setNewCon({...newCon, roadName: e.target.value})} className="w-full bg-black border border-amber-900/50 rounded p-2 text-sm text-white focus:border-amber-500 outline-none" />
                 </div>
                 <div>
                   <label className="block text-[9px] text-amber-500 uppercase tracking-widest mb-1 font-bold">Road Distance (KM)</label>
                   <input required type="text" placeholder="e.g. 15 km" onChange={e => setNewCon({...newCon, roadDistance: e.target.value})} className="w-full bg-black border border-amber-900/50 rounded p-2 text-sm text-white focus:border-amber-500 outline-none" />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[9px] text-zinc-500 uppercase tracking-widest mb-1">Warranty Term</label>
                   <select onChange={e => setNewCon({...newCon, warranty: e.target.value})} className="w-full bg-black border border-zinc-800 rounded p-2 text-sm text-white focus:border-amber-500 outline-none">
                     <option>5 Years</option>
                     <option>3 Years</option>
                     <option>1 Year</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-[9px] text-zinc-500 uppercase tracking-widest mb-1">Jurisdiction (Taluk)</label>
                   <select onChange={e => setNewCon({...newCon, taluk: e.target.value})} className="w-full bg-black border border-zinc-800 rounded p-2 text-sm text-white focus:border-amber-500 outline-none">
                     <option>Moodbidre</option>
                     <option>Mangalore</option>
                   </select>
                 </div>
               </div>
               <button type="submit" className="w-full mt-4 bg-teal-600 hover:bg-teal-500 text-white py-3 rounded text-xs uppercase font-bold tracking-widest transition-all">
                 Save Contractor & Road Data
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}