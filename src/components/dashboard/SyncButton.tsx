"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncSummary {
  status: "SUCCESS" | "PARTIAL" | "FAILED";
  gamesSynced: number;
  newGamesAdded: number;
  totalPlaytimeMinutes: number;
  errors: string[];
}

export function SyncButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [syncing, setSyncing] = useState(false);
  const [summary, setSummary] = useState<SyncSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setError(null);
    setSummary(null);

    try {
      const response = await fetch("/api/steam/sync", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "La synchronisation a échoué.");
        return;
      }

      setSummary(data);
      startTransition(() => router.refresh());
    } catch {
      setError("Impossible de contacter le serveur. Vérifie ta connexion.");
    } finally {
      setSyncing(false);
    }
  }

  const busy = syncing || isPending;

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleSync}
        disabled={busy}
        className={cn(
          "flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition",
          busy
            ? "cursor-not-allowed bg-white/5 text-slate-500"
            : "bg-steam text-void shadow-glow hover:bg-steam-deep hover:text-white"
        )}
      >
        <RefreshCw className={cn("h-4 w-4", busy && "animate-spin")} />
        {busy ? "Synchronisation en cours…" : "Synchroniser mon compte Steam"}
      </button>

      {summary && (
        <div className="glass-panel flex items-start gap-2.5 p-3 text-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-unlocked" />
          <div className="text-slate-300">
            <p>
              {summary.gamesSynced} jeux synchronisés · {summary.newGamesAdded} nouveaux
              jeux ajoutés
            </p>
            {summary.errors.length > 0 && (
              <p className="mt-1 text-xs text-warn">
                {summary.errors.length} jeu(x) ignoré(s) suite à une erreur — voir le
                journal de synchronisation.
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="glass-panel flex items-start gap-2.5 p-3 text-sm text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
