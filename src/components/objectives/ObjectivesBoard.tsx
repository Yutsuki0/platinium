"use client";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, PauseCircle, Target, Trophy } from "lucide-react";
import type { StoredAchievementSummary, StoredGame, StoredGameObjective } from "@/lib/json/store";

type Filter = "ALL"|"ACTIVE"|"PAUSED"|"COMPLETED";
export function ObjectivesBoard({ games, summaries, objectives }: { games: StoredGame[]; summaries: StoredAchievementSummary[]; objectives: StoredGameObjective[] }) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const gameMap = useMemo(()=>new Map(games.map(g=>[g.appId,g])),[games]);
  const summaryMap = useMemo(()=>new Map(summaries.map(s=>[s.appId,s])),[summaries]);
  const visible = objectives.filter(o=>filter==="ALL"||o.status===filter).sort((a,b)=>{
    const p={HIGH:3,MEDIUM:2,LOW:1};
    if(p[b.priority]!==p[a.priority]) return p[b.priority]-p[a.priority];
    if(a.targetDate && b.targetDate) return a.targetDate.localeCompare(b.targetDate);
    return b.updatedAt.localeCompare(a.updatedAt);
  });
  const counts = { ALL: objectives.length, ACTIVE: objectives.filter(o=>o.status==="ACTIVE").length, PAUSED: objectives.filter(o=>o.status==="PAUSED").length, COMPLETED: objectives.filter(o=>o.status==="COMPLETED").length };
  const labels: Array<[Filter,string]>=[["ALL","Tous"],["ACTIVE","En cours"],["PAUSED","En pause"],["COMPLETED","Terminés"]];
  return <div className="flex flex-col gap-5">
    <div className="flex flex-wrap gap-2">{labels.map(([value,label])=><button key={value} onClick={()=>setFilter(value)} className={`rounded-full border px-3 py-1.5 text-xs ${filter===value?"border-steam/50 bg-steam/15 text-white":"border-white/10 text-slate-400"}`}>{label} <span className="ml-1 opacity-60">{counts[value]}</span></button>)}</div>
    {visible.length===0 ? <div className="glass-panel flex min-h-64 flex-col items-center justify-center p-8 text-center"><Target className="h-10 w-10 text-slate-600"/><h2 className="mt-4 font-display text-lg font-semibold text-white">Aucun objectif</h2><p className="mt-2 max-w-md text-sm text-slate-400">Ouvre la fiche d’un jeu et ajoute-le à tes objectifs.</p><Link href="/games" className="mt-5 rounded-lg bg-steam px-4 py-2 text-sm font-semibold text-white">Choisir un jeu</Link></div> : <div className="grid gap-4 lg:grid-cols-2">{visible.map(o=>{const game=gameMap.get(o.appId); if(!game)return null; const s=summaryMap.get(o.appId); const remaining=s?Math.max(s.total-s.unlocked,0):null; return <Link href={`/games/${o.appId}`} key={o.appId} className="glass-panel group overflow-hidden p-4 transition hover:border-steam/30"><div className="flex gap-4"><div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-lg bg-white/5"><Image src={`https://cdn.akamai.steamstatic.com/steam/apps/${o.appId}/header.jpg`} alt={game.name} fill unoptimized className="object-cover"/></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h2 className="truncate font-display font-semibold text-white">{game.name}</h2><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${o.priority==="HIGH"?"bg-red-500/15 text-red-200":o.priority==="LOW"?"bg-slate-500/15 text-slate-300":"bg-amber-500/15 text-amber-200"}`}>{o.priority==="HIGH"?"Priorité haute":o.priority==="LOW"?"Priorité faible":"Priorité normale"}</span></div><div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400"><span className="inline-flex items-center gap-1.5">{o.status==="COMPLETED"?<CheckCircle2 className="h-4 w-4 text-emerald-400"/>:o.status==="PAUSED"?<PauseCircle className="h-4 w-4 text-amber-300"/>:<Target className="h-4 w-4 text-steam"/>}{o.status==="COMPLETED"?"Terminé":o.status==="PAUSED"?"En pause":"En cours"}</span>{o.targetDate&&<span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4"/>{new Date(`${o.targetDate}T12:00:00`).toLocaleDateString("fr-FR")}</span>}</div>{s&&<><div className="mt-4 h-1.5 rounded-full bg-white/5"><div className="h-full rounded-full bg-steam" style={{width:`${s.percentage}%`}}/></div><div className="mt-2 flex justify-between text-[11px] text-slate-500"><span className="inline-flex items-center gap-1"><Trophy className="h-3.5 w-3.5"/>{remaining} restant{remaining!==1?"s":""}</span><span>{s.percentage}%</span></div></>}{o.note&&<p className="mt-3 line-clamp-2 text-xs text-slate-500">{o.note}</p>}</div></div></Link>})}</div>}
  </div>
}
