import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Crosshair, Flame, Route, Trophy, Zap } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { readStore } from "@/lib/json/store";

export const dynamic="force-dynamic";
export default async function HuntPage(){
 const session=await getServerSession(authOptions); const userId=session!.user.id; const store=await readStore();
 const games=new Map(store.games.filter(g=>g.userId===userId).map(g=>[g.appId,g]));
 const summaries=new Map(store.achievementSummaries.filter(s=>s.userId===userId).map(s=>[s.appId,s]));
 const locked=store.achievements.filter(a=>a.userId===userId&&!a.achieved);
 const ranked=locked.map(a=>{const s=summaries.get(a.appId);const g=games.get(a.appId);const remaining=s?Math.max(s.total-s.unlocked,0):999;let score=0;if(!a.hidden)score+=30;if(a.description)score+=10;if(s)score+=s.percentage;score+=Math.max(0,25-remaining);return{a,s,g,score}}).filter(x=>x.g&&x.s).sort((a,b)=>b.score-a.score).slice(0,8);
 const focusGame=ranked[0]?.g; const focusSummary=ranked[0]?.s;
 return <div className="space-y-6">
  <header className="code-hero"><div><p className="code-kicker">$ platinum --hunt-mode</p><h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-5xl">Mode chasse</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">Une file d’action calculée à partir de ta progression réelle : commencer par les succès visibles et les jeux les plus proches du 100 %.</p></div><Crosshair className="h-24 w-24 text-emerald-300/20"/></header>
  {focusGame&&focusSummary?<section className="mission-card"><div className="relative min-h-72 overflow-hidden rounded-[22px]"><Image src={`https://cdn.akamai.steamstatic.com/steam/apps/${focusGame.appId}/header.jpg`} alt={focusGame.name} fill unoptimized className="object-cover"/><div className="absolute inset-0 bg-gradient-to-r from-[#05070d] via-[#05070d]/85 to-transparent"/><div className="relative z-10 flex min-h-72 max-w-2xl flex-col justify-end p-7"><div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-orange-300/20 bg-orange-300/10 px-3 py-1 text-xs text-orange-200"><Flame className="h-3.5 w-3.5"/>Mission prioritaire</div><h2 className="text-3xl font-black text-white">{focusGame.name}</h2><p className="mt-2 text-sm text-slate-300">{focusSummary.total-focusSummary.unlocked} succès à terminer • {focusSummary.percentage}% complété</p><Link href={`/games/${focusGame.appId}`} className="cyber-button mt-5 w-fit"><Zap className="h-4 w-4"/>Lancer la chasse</Link></div></div></section>:<div className="terminal-card p-10 text-center text-slate-400">Analyse les succès de quelques jeux pour générer ta première mission.</div>}
  <section className="terminal-card p-5"><div className="terminal-title"><span className="terminal-dot red"/><span className="terminal-dot amber"/><span className="terminal-dot green"/><span className="ml-3">queue/recommended-achievements.json</span></div><div className="mt-5 grid gap-3">{ranked.map(({a,g,s},index)=><Link key={`${a.appId}-${a.apiName}`} href={`/games/${a.appId}`} className="code-row group"><div className="flex items-center gap-4"><span className="rank-token">{String(index+1).padStart(2,"0")}</span><div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-white/5">{a.iconGrayUrl||a.iconUrl?<Image src={a.iconGrayUrl||a.iconUrl!} alt="" fill unoptimized className="object-cover opacity-80"/>:<Trophy className="absolute inset-0 m-auto h-5 w-5 text-slate-500"/>}</div><div><p className="text-sm font-semibold text-white">{a.displayName}</p><p className="mt-1 text-xs text-slate-500">{g!.name} • {s!.percentage}%</p></div></div><Route className="h-4 w-4 text-slate-600 transition group-hover:text-emerald-300"/></Link>)}</div></section>
 </div>
}
