"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function AchievementSyncButton({ appId }: { appId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sync() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/steam/achievements/${appId}`, { method: "POST" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "La synchronisation a échoué");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={sync}
        disabled={loading}
        className="inline-flex h-11 items-center gap-2 rounded-lg bg-steam px-4 text-sm font-semibold text-[#07111b] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Analyse en cours…" : "Analyser les succès"}
      </button>
      {error && <p className="max-w-sm text-right text-xs text-red-300">{error}</p>}
    </div>
  );
}
