import { ExternalLink, PackageOpen, ShoppingBag } from "lucide-react";
import type { StoredDlcGroup } from "@/lib/json/store";

export function DlcMarketplacePanel({ gameName, groups }: { gameName: string; groups: StoredDlcGroup[] }) {
  const paid = groups.filter((group) => group.paid);
  if (paid.length === 0) return null;
  return <section className="terminal-card p-5">
    <div className="terminal-title"><span className="terminal-dot red"/><span className="terminal-dot amber"/><span className="terminal-dot green"/><span className="ml-3">marketplace/dlc-check.ts</span></div>
    <div className="mt-5 flex items-start gap-3"><PackageOpen className="mt-0.5 h-5 w-5 text-emerald-300"/><div><h2 className="font-semibold text-white">DLC nécessaires au 100 %</h2><p className="mt-1 text-xs leading-relaxed text-slate-400">Steam ne permet pas ici de confirmer automatiquement les DLC possédés. Vérifie ta bibliothèque, puis utilise le lien de recherche si un DLC te manque.</p></div></div>
    <div className="mt-4 grid gap-3 md:grid-cols-2">{paid.map(group=>{
      const query=encodeURIComponent(`${gameName} ${group.name}`);
      return <div key={group.name} className="code-row"><div><p className="text-sm font-medium text-white">{group.name}</p><p className="mt-1 text-[11px] text-slate-500">{group.achievementApiNames.length} succès associés</p></div><a href={`https://www.instant-gaming.com/fr/rechercher/?query=${query}`} target="_blank" rel="noreferrer" className="ghost-button shrink-0"><ShoppingBag className="h-4 w-4"/>Instant Gaming<ExternalLink className="h-3 w-3"/></a></div>
    })}</div>
    <p className="mt-4 text-[10px] text-slate-600">Lien de recherche non affilié. Vérifie toujours la plateforme, la région et le contenu avant achat.</p>
  </section>
}
