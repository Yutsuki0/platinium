"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Square } from "lucide-react";

interface BulkAchievementSyncButtonProps {
  appIds: number[];
  alreadySyncedAppIds: number[];
}

export function BulkAchievementSyncButton({
  appIds,
  alreadySyncedAppIds,
}: BulkAchievementSyncButtonProps) {
  const router = useRouter();
  const stopRequested = useRef(false);
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const [errors, setErrors] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  async function startSync(syncAll: boolean) {
    const synced = new Set(alreadySyncedAppIds);
    const queue = syncAll ? appIds : appIds.filter((appId) => !synced.has(appId));

    if (queue.length === 0) {
      setMessage("Tous les jeux ont déjà été analysés.");
      return;
    }

    stopRequested.current = false;
    setRunning(true);
    setCurrent(0);
    setTotal(queue.length);
    setErrors(0);
    setMessage(null);

    let failed = 0;

    for (let index = 0; index < queue.length; index += 1) {
      if (stopRequested.current) {
        setMessage(`Synchronisation arrêtée après ${index} jeu${index > 1 ? "x" : ""}.`);
        break;
      }

      const appId = queue[index];

      try {
        const response = await fetch(`/api/steam/achievements/${appId}`, {
          method: "POST",
        });

        if (!response.ok) failed += 1;
      } catch {
        failed += 1;
      }

      setCurrent(index + 1);
      setErrors(failed);

      // Petite pause pour ne pas envoyer trop de requêtes à Steam d'un coup.
      await new Promise((resolve) => window.setTimeout(resolve, 250));
    }

    if (!stopRequested.current) {
      setMessage(
        failed === 0
          ? "Tous les jeux ont été synchronisés avec succès."
          : `Synchronisation terminée avec ${failed} jeu${failed > 1 ? "x" : ""} ignoré${failed > 1 ? "s" : ""}.`
      );
    }

    setRunning(false);
    router.refresh();
  }

  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const missingCount = Math.max(appIds.length - alreadySyncedAppIds.length, 0);

  return (
    <div className="glass-panel flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-display text-base font-semibold text-white">
            Synchronisation des succès
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {alreadySyncedAppIds.length} jeu{alreadySyncedAppIds.length > 1 ? "x" : ""} analysé{alreadySyncedAppIds.length > 1 ? "s" : ""} sur {appIds.length}.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!running ? (
            <>
              <button
                type="button"
                onClick={() => startSync(false)}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-steam px-4 text-sm font-semibold text-[#07111b] transition hover:brightness-110"
              >
                <RefreshCw className="h-4 w-4" />
                {missingCount > 0
                  ? `Analyser les ${missingCount} jeux restants`
                  : "Vérifier les jeux"}
              </button>
              {alreadySyncedAppIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => startSync(true)}
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08]"
                >
                  Tout resynchroniser
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                stopRequested.current = true;
              }}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-red-400/20 bg-red-400/10 px-4 text-sm font-medium text-red-200 transition hover:bg-red-400/15"
            >
              <Square className="h-4 w-4" /> Arrêter
            </button>
          )}
        </div>
      </div>

      {running && (
        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span>
              Jeu {current} sur {total}{errors > 0 ? ` · ${errors} ignoré${errors > 1 ? "s" : ""}` : ""}
            </span>
            <span className="font-mono text-white">{percentage}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-steam transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Tu peux laisser cette page ouverte pendant l’analyse. Cela peut prendre quelques minutes.
          </p>
        </div>
      )}

      {message && !running && <p className="text-sm text-slate-300">{message}</p>}
    </div>
  );
}
