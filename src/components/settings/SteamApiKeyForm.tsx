"use client";
import { useState } from "react";
import { Check, KeyRound, Loader2, Trash2 } from "lucide-react";

export function SteamApiKeyForm({ configured }: { configured: boolean }) {
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle"|"saving"|"saved"|"error">("idle");
  const [message, setMessage] = useState("");
  async function save() {
    setState("saving"); setMessage("");
    const response = await fetch("/api/settings/steam-key", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({apiKey:value}) });
    const data = await response.json().catch(()=>({}));
    if (!response.ok) { setState("error"); setMessage(data.error || "Impossible d’enregistrer la clé."); return; }
    setValue(""); setState("saved"); setMessage("Clé chiffrée et enregistrée dans un cookie HttpOnly sur cet appareil.");
  }
  async function remove() { await fetch("/api/settings/steam-key", {method:"DELETE"}); location.reload(); }
  return <div className="terminal-card p-5">
    <div className="terminal-title"><span className="terminal-dot red"/><span className="terminal-dot amber"/><span className="terminal-dot green"/><span className="ml-3">config/steam-api.key</span></div>
    <div className="mt-5 flex items-center gap-3"><KeyRound className="h-5 w-5 text-emerald-300"/><div><h2 className="font-semibold text-white">Clé API personnelle</h2><p className="text-xs text-slate-400">Mode BYOK : chacun utilise sa propre clé, elle n’est jamais écrite dans GitHub.</p></div></div>
    <div className="mt-4 flex flex-col gap-3 sm:flex-row"><input value={value} onChange={e=>setValue(e.target.value)} placeholder={configured?"••••••••••••••••••••••••••••••••":"Colle ta clé Steam Web API"} className="code-input flex-1"/><button onClick={save} disabled={state==="saving"||!value} className="cyber-button">{state==="saving"?<Loader2 className="h-4 w-4 animate-spin"/>:<Check className="h-4 w-4"/>}Enregistrer</button>{configured&&<button onClick={remove} className="ghost-button"><Trash2 className="h-4 w-4"/>Retirer</button>}</div>
    {message&&<p className={`mt-3 text-xs ${state==="error"?"text-rose-300":"text-emerald-300"}`}>{message}</p>}
    <p className="mt-4 text-[11px] leading-relaxed text-slate-500">Pour une instance publique, définis aussi <code>NEXTAUTH_SECRET</code> sur l’hébergeur. Le serveur déchiffre la clé uniquement au moment d’appeler Steam.</p>
  </div>
}
