"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, Save, Trash2 } from "lucide-react";
import type { StoredGameObjective } from "@/lib/json/store";

export function ObjectiveEditor({ appId, initialObjective }: { appId: number; initialObjective: StoredGameObjective | null }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialObjective?.status ?? "ACTIVE");
  const [priority, setPriority] = useState(initialObjective?.priority ?? "MEDIUM");
  const [targetDate, setTargetDate] = useState(initialObjective?.targetDate ?? "");
  const [note, setNote] = useState(initialObjective?.note ?? "");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setPending(true); setMessage("");
    const response = await fetch(`/api/games/${appId}/objective`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, priority, targetDate, note }) });
    setPending(false);
    setMessage(response.ok ? "Objectif enregistré" : "Erreur pendant l’enregistrement");
    if (response.ok) router.refresh();
  }

  async function remove() {
    setPending(true); setMessage("");
    const response = await fetch(`/api/games/${appId}/objective`, { method: "DELETE" });
    setPending(false);
    if (response.ok) { setMessage("Objectif supprimé"); router.refresh(); }
    else setMessage("Erreur pendant la suppression");
  }

  return (
    <section className="glass-panel p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-steam/15 text-steam"><Flag className="h-5 w-5" /></div>
        <div><h2 className="font-display text-lg font-semibold text-white">Objectif personnel</h2><p className="text-sm text-slate-400">Ajoute ce jeu à ta liste de jeux à terminer.</p></div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label className="text-sm text-slate-300">Statut<select value={status} onChange={(e)=>setStatus(e.target.value as typeof status)} className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#06130b] px-3 text-white"><option value="ACTIVE">En cours</option><option value="PAUSED">En pause</option><option value="COMPLETED">Terminé</option></select></label>
        <label className="text-sm text-slate-300">Priorité<select value={priority} onChange={(e)=>setPriority(e.target.value as typeof priority)} className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#06130b] px-3 text-white"><option value="LOW">Faible</option><option value="MEDIUM">Normale</option><option value="HIGH">Haute</option></select></label>
        <label className="text-sm text-slate-300">Date cible<input type="date" value={targetDate ?? ""} onChange={(e)=>setTargetDate(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#06130b] px-3 text-white" /></label>
      </div>
      <label className="mt-4 block text-sm text-slate-300">Note<textarea value={note} onChange={(e)=>setNote(e.target.value)} maxLength={500} rows={3} placeholder="Ex. Finir les succès restants ce mois-ci…" className="mt-2 w-full rounded-lg border border-white/10 bg-[#06130b] p-3 text-white placeholder:text-slate-600" /></label>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={save} disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-steam px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" />Enregistrer</button>
        {initialObjective && <button onClick={remove} disabled={pending} className="inline-flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-200 disabled:opacity-50"><Trash2 className="h-4 w-4" />Supprimer</button>}
        {message && <span className="text-sm text-slate-400">{message}</span>}
      </div>
    </section>
  );
}
