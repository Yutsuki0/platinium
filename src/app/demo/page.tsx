import { Flame, Trophy, Clock, PackageX, Sparkles } from "lucide-react";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { formatPlaytime } from "@/lib/utils";

// --- Données de démonstration (voir section 33 du cahier des charges) ---
// Remplacées en Phase 2 par les données réelles issues de la synchronisation Steam.

const demoStats = [
  { label: "Jeux possédés", value: "184", icon: Flame },
  { label: "Succès obtenus", value: "3 412", icon: Trophy },
  { label: "Temps de jeu total", value: formatPlaytime(842 * 60), icon: Clock },
  { label: "Jeux à 100 %", value: "4", icon: Sparkles },
];

const demoNearCompletion = [
  { name: "Hades", progress: 96, missing: 2 },
  { name: "Hollow Knight", progress: 91, missing: 5 },
  { name: "Stardew Valley", progress: 88, missing: 4 },
];

const demoDlcRequired = [
  { name: "Cyberpunk 2077", dlc: "Phantom Liberty", owned: false },
  { name: "Divinity: Original Sin 2", dlc: "Definitive Edition", owned: true },
];

export default function DemoDashboardPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 lg:px-6">
      <div className="glass-panel px-4 py-2 text-xs text-slate-400">
        Ceci est une démonstration statique — <a href="/" className="text-steam hover:underline">retour à l&apos;accueil</a>
      </div>
      <header className="glass-panel flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs uppercase tracking-widest text-steam/80">
            Mode démonstration
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-white">
            Bienvenue sur ton parcours vers le 100 %
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Ces données sont fictives. Connecte ton compte Steam pour voir ta
            vraie bibliothèque.
          </p>
        </div>
        <button className="whitespace-nowrap rounded-lg bg-steam px-4 py-2.5 text-sm font-semibold text-void shadow-glow transition hover:bg-steam-deep hover:text-white">
          Se connecter avec Steam
        </button>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {demoStats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="glass-panel flex flex-col gap-3 p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-steam/10 text-steam">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="stat-value">{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </section>

      <DashboardCharts />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass-panel p-5">
          <h2 className="font-display text-sm font-semibold text-white">
            Jeux proches du 100 %
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {demoNearCompletion.map((game) => (
              <li key={game.name} className="flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 rounded-md bg-white/5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-200">{game.name}</span>
                    <span className="font-mono text-xs text-steam">
                      {game.progress}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-steam-deep to-steam"
                      style={{ width: `${game.progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-slate-500">
                  {game.missing} restants
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-panel p-5">
          <h2 className="font-display flex items-center gap-2 text-sm font-semibold text-white">
            <PackageX className="h-4 w-4 text-warn" />
            Jeux nécessitant un DLC
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {demoDlcRequired.map((item) => (
              <li
                key={item.name}
                className="flex items-center justify-between rounded-lg border border-surface-hairline bg-white/[0.02] px-3 py-2.5"
              >
                <div>
                  <p className="text-sm text-slate-200">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.dlc}</p>
                </div>
                <span
                  className={
                    item.owned
                      ? "rarity-pill border-unlocked/30 bg-unlocked/10 text-unlocked"
                      : "rarity-pill border-warn/30 bg-warn/10 text-warn"
                  }
                >
                  {item.owned ? "DLC possédé" : "DLC non possédé"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
