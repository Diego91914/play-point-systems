"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type EventRow = { id:string; name:string; event_date:string; join_code:string; status:string };
type Player = { id:string; display_name:string; pdga_number:number|null; rating:number|null; division:string|null; source:string; checked_in:boolean };

export function LeagueNightClient({ signedIn }: { signedIn:boolean }) {
  const [events,setEvents]=useState<EventRow[]>([]);
  const [selected,setSelected]=useState<EventRow|null>(null);
  const [players,setPlayers]=useState<Player[]>([]);
  const [name,setName]=useState("League Night");
  const [distance,setDistance]=useState(20);
  const [stackSize,setStackSize]=useState(10);
  const [playerName,setPlayerName]=useState("");
  const [status,setStatus]=useState("");
  const [importText,setImportText]=useState("");

  async function loadEvents(){
    if(!signedIn) return;
    const r=await fetch("/api/league-night",{cache:"no-store"});
    if(r.ok){const d=await r.json(); setEvents(d.events??[]);}
  }
  async function loadRoster(id:string){
    const r=await fetch("/api/league-night/roster?eventId="+encodeURIComponent(id),{cache:"no-store"});
    if(r.ok){const d=await r.json(); setPlayers(d.players??[]);}
  }
  useEffect(()=>{void loadEvents();},[signedIn]);
  useEffect(()=>{if(selected) void loadRoster(selected.id);},[selected]);

  async function createEvent(){
    setStatus("Creating…");
    const r=await fetch("/api/league-night",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name,distance,stackSize})});
    const d=await r.json();
    if(!r.ok){setStatus(d.error??"Could not create event.");return;}
    setSelected(d.event); setPlayers([]); setStatus("League Night ready."); await loadEvents();
  }
  async function addPlayer(){
    if(!selected||!playerName.trim()) return;
    const r=await fetch("/api/league-night/roster",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({eventId:selected.id,name:playerName})});
    if(r.ok){setPlayerName(""); await loadRoster(selected.id);}
  }
  async function importRoster(){
    if(!selected||!importText.trim()) return;
    const lines=importText.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    if(!lines.length) return;
    const delimiter=lines[0].includes("\t")?"\t":",";
    const cells=(line:string)=>line.split(delimiter).map(x=>x.trim().replace(/^"|"$/g,""));
    const header=cells(lines[0]).map(x=>x.toLowerCase());
    const find=(names:string[])=>header.findIndex(h=>names.some(n=>h===n||h.includes(n)));
    const first=find(["first name","firstname","first"]);
    const last=find(["last name","lastname","last"]);
    const full=find(["player name","display name","name"]);
    const pdga=find(["pdga","pdga #","pdga number"]);
    const rating=find(["rating"]);
    const division=find(["division","div"]);
    const start=(first>=0||last>=0||full>=0||pdga>=0)?1:0;
    let added=0;
    for(const line of lines.slice(start)){
      const row=cells(line);
      const player=(full>=0?row[full]:[first>=0?row[first]:"",last>=0?row[last]:""].filter(Boolean).join(" ")).trim();
      if(!player) continue;
      const response=await fetch("/api/league-night/roster",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({eventId:selected.id,name:player,pdgaNumber:pdga>=0?Number(row[pdga])||undefined:undefined,rating:rating>=0?Number(row[rating])||undefined:undefined,division:division>=0?row[division]||undefined:undefined})});
      if(response.ok) added++;
    }
    setImportText(""); setStatus(`${added} players imported.`); await loadRoster(selected.id);
  }
  const joinUrl=selected ? (typeof window!=="undefined" ? window.location.origin : "")+"/league-night/join/"+selected.join_code : "";

  return <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
    <header className="mb-7"><div className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-200/60">Tournament Director</div><h1 className="mt-2 text-4xl font-black text-white">LEAGUE NIGHT</h1><p className="mt-2 text-sm text-white/55">One roster. Add games without changing how you run your tournament.</p></header>
    {!signedIn ? <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-6 text-white/65">Sign in to create and manage a League Night.</section> :
    <div className="grid gap-5">
      <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-white/50">Create League Night</div>
        <input value={name} onChange={e=>setName(e.target.value)} className="mt-3 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base text-white" aria-label="Event name"/>
        <div className="mt-3 grid grid-cols-2 gap-3"><label className="text-xs text-white/50">Distance (ft)<input type="number" min={1} max={100} value={distance} onChange={e=>setDistance(Math.max(1,Math.min(100,Number(e.target.value)||20)))} className="mt-1 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base font-bold text-white"/></label><label className="text-xs text-white/50">Discs<input type="number" min={1} max={100} value={stackSize} onChange={e=>setStackSize(Math.max(1,Math.min(100,Number(e.target.value)||10)))} className="mt-1 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base font-bold text-white"/></label></div>
        <button type="button" onClick={createEvent} className="mt-4 min-h-12 w-full rounded-2xl bg-cyan-300 font-black text-slate-950">CREATE + ADD CLEAR THE STACK</button>
        {status ? <div className="mt-2 text-center text-xs text-white/45">{status}</div>:null}
      </section>
      {events.length ? <section><div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-white/45">Your League Nights</div><div className="flex flex-wrap gap-2">{events.map(e=><button key={e.id} type="button" onClick={()=>setSelected(e)} className={"rounded-full border px-4 py-2 text-sm font-bold "+(selected?.id===e.id?"border-cyan-200/40 bg-cyan-300/15 text-white":"border-white/10 bg-black/20 text-white/60")}>{e.name} · {e.event_date}</button>)}</div></section>:null}
      {selected ? <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-2xl font-black text-white">{selected.name}</div><div className="mt-1 text-sm text-white/45">{players.length} players · Clear the Stack</div></div><div className="rounded-xl bg-cyan-300/10 px-3 py-2 text-center"><div className="text-[10px] font-black uppercase text-cyan-100/50">Join code</div><div className="font-black tracking-[0.16em] text-cyan-50">{selected.join_code}</div></div></div>
        <div className="mt-4 rounded-2xl border border-dashed border-white/15 p-4"><div className="text-xs font-black uppercase tracking-[0.16em] text-white/45">Player self check-in</div><div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:items-start"><div className="rounded-2xl bg-white p-3">{joinUrl ? <QRCodeSVG value={joinUrl} size={176} level="M" includeMargin /> : null}</div><div className="min-w-0"><div className="break-all text-sm text-cyan-100">{joinUrl}</div><p className="mt-2 text-xs text-white/40">Put this QR at registration. Players scan, enter their name and optional PDGA number, and appear on this roster.</p></div></div></div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/15 p-4"><div className="text-xs font-black uppercase tracking-[0.16em] text-white/45">Import doubles roster</div><p className="mt-1 text-xs text-white/35">Paste rows copied from Excel. Name / First Name / Last Name, PDGA #, Rating and Division are recognized automatically.</p><textarea value={importText} onChange={e=>setImportText(e.target.value)} rows={5} placeholder={"First Name\tLast Name\tPDGA #\tRating\tDivision"} className="mt-3 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white"/><button type="button" onClick={importRoster} disabled={!importText.trim()} className="mt-3 min-h-11 w-full rounded-2xl border border-cyan-200/20 bg-cyan-300/10 font-black text-cyan-50 disabled:opacity-40">IMPORT ROSTER</button></div>
        <div className="mt-4 flex gap-2"><input value={playerName} onChange={e=>setPlayerName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter") void addPlayer();}} placeholder="Quick add player" className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base text-white"/><button type="button" onClick={addPlayer} className="rounded-2xl bg-white px-4 font-black text-slate-950">ADD</button></div>
        <div className="mt-4 grid gap-2">{players.map((p,i)=><div key={p.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3"><div><span className="font-black text-white">#{i+1} {p.display_name}</span>{p.pdga_number?<span className="ml-2 text-xs text-white/40">PDGA #{p.pdga_number}</span>:null}</div><div className="text-[10px] font-black uppercase tracking-wider text-white/35">{p.source}</div></div>)}</div>
      </section>:null}
    </div>}
  </main>;
}
