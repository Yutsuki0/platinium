"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Shield, Trophy } from "lucide-react";

type Data = { user:{name:string;image:string|null}; level:number; current:number; needed:number; title:string; totalXp:number; rank:{name:string;icon:string}; profile?:{huntPoints:number;completedHunts:number}|null };
export function ProfileWindow() {
  const [data,setData] = useState<Data|null>(null);
  useEffect(() => { fetch("/api/fullclear/profile").then((r)=>r.ok?r.json():null).then(setData).catch(()=>{}); }, []);
  if (!data) return <div className="p-5 text-xs text-emerald-200/50">loading profile.runtime…</div>;
  return <div className="flex h-full flex-col p-5">
    <div className="flex items-center gap-3">
      <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-emerald-300/30 bg-emerald-300/5">{data.user.image?<Image src={data.user.image} alt="" fill unoptimized className="object-cover"/>:<Trophy className="absolute inset-0 m-auto h-6 w-6 text-emerald-300"/>}</div>
      <div className="min-w-0"><p className="truncate text-sm font-bold text-white">{data.user.name}</p><p className="text-[10px] uppercase tracking-[.18em] text-emerald-300/55">{data.title}</p></div>
    </div>
    <div className="mt-5 grid grid-cols-2 gap-2 text-center"><div className="rounded-xl border border-emerald-400/10 bg-black/20 p-3"><p className="text-xl font-black text-white">{data.level}</p><p className="text-[9px] uppercase text-slate-500">Niveau</p></div><div className="rounded-xl border border-emerald-400/10 bg-black/20 p-3"><p className="text-xl font-black text-white">{data.profile?.huntPoints??0}</p><p className="text-[9px] uppercase text-slate-500">Hunt pts</p></div></div>
    <div className="mt-4"><div className="flex justify-between text-[10px] text-slate-500"><span>XP {data.current}</span><span>{data.needed}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5"><span className="block h-full bg-emerald-400" style={{width:`${Math.min(100,data.current/data.needed*100)}%`}}/></div></div>
    <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-400/10 bg-emerald-400/[.04] p-3"><Image src={data.rank.icon} alt="" width={42} height={42}/><div><p className="text-xs font-bold text-white">{data.rank.name}</p><p className="text-[9px] uppercase text-emerald-300/50">Hunt rank</p></div></div>
    <Link href="/profile" className="cyber-button mt-auto justify-center"><Shield className="h-4 w-4"/>Ouvrir le profil</Link>
  </div>;
}
