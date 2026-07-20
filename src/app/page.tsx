import Link from "next/link";
import {
  Trophy,
  Target,
  PackageSearch,
  ShieldCheck,
  Gauge,
  Sparkles,
} from "lucide-react";

const FEATURES = [
  {
    icon: Trophy,
    title: "Succès manquants en un coup d'œil",
    description:
      "Chaque jeu affiche précisément ce qu'il te reste à débloquer pour atteindre 100 %.",
  },
  {
    icon: Target,
    title: "Objectifs quotidiens",
    description:
      "Des suggestions personnalisées selon ton temps disponible et ta progression.",
  },
  {
    icon: PackageSearch,
    title: "DLC nécessaires identifiés",
    description:
      "Sache immédiatement si un jeu réclame un DLC — et si tu le possèdes déjà.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-24 px-4 py-16 sm:px-8 lg:px-16">
      {/* Hero */}
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-steam/80">
          Steam Platinum Tracker
        </p>
        <h1 className="font-display text-4xl font-semibold leading-tight text-white sm:text-5xl">
          Transforme ta bibliothèque Steam en véritable parcours vers le 100&nbsp;%.
        </h1>
        <p className="max-w-xl text-base text-slate-400">
          Retrouve tes succès manquants, organise tes objectifs et découvre
          les DLC nécessaires pour terminer chaque jeu.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="/api/steam/login"
            className="rounded-lg bg-steam px-5 py-3 text-sm font-semibold text-void shadow-glow transition hover:bg-steam-deep hover:text-white"
          >
            Se connecter avec Steam
          </a>
          <Link
            href="/demo"
            className="rounded-lg border border-surface-hairline bg-white/[0.03] px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06]"
          >
            Voir une démonstration
          </Link>
        </div>
      </section>

      {/* Aperçu du tableau de bord */}
      <section className="mx-auto w-full max-w-4xl">
        <div className="glass-panel-strong relative overflow-hidden p-2">
          <div className="ambient-orb left-1/2 top-0 h-64 w-64 -translate-x-1/2 bg-steam/25" />
          <div className="relative rounded-xl2 border border-surface-hairline bg-abyss/60 p-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ["184", "Jeux"],
                ["3 412", "Succès obtenus"],
                ["842 h", "Temps de jeu"],
                ["4", "Jeux à 100 %"],
              ].map(([value, label]) => (
                <div key={label} className="glass-panel p-4">
                  <p className="stat-value text-xl">{value}</p>
                  <p className="text-[11px] text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-5 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="glass-panel p-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-steam/10 text-steam">
              <Icon className="h-4 w-4" />
            </div>
            <h3 className="mt-4 font-display text-sm font-semibold text-white">
              {title}
            </h3>
            <p className="mt-2 text-sm text-slate-400">{description}</p>
          </div>
        ))}
      </section>

      {/* Sécurité & confidentialité */}
      <section className="mx-auto w-full max-w-4xl">
        <div className="glass-panel flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-unlocked/10 text-unlocked">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold text-white">
              Sécurité et confidentialité
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Nous ne demandons, ne stockons et n&apos;affichons jamais ton mot
              de passe Steam. La connexion passe uniquement par Steam OpenID,
              et notre clé API Steam reste côté serveur : elle n&apos;est
              jamais exposée dans ton navigateur.
            </p>
          </div>
        </div>
      </section>

      {/* Limites de l'API */}
      <section className="mx-auto w-full max-w-4xl">
        <div className="glass-panel flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warn/10 text-warn">
            <Gauge className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold text-white">
              Limites de l&apos;API Steam
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Ton profil et tes détails de jeu doivent être publics pour que
              la synchronisation fonctionne. Certaines informations (succès
              cachés, pourcentages mondiaux, serveurs multijoueur) dépendent
              de ce que Steam expose publiquement et peuvent parfois manquer
              ou être temporairement indisponibles.
            </p>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-4xl items-center justify-center gap-2 pb-8 text-xs text-slate-600">
        <Sparkles className="h-3.5 w-3.5" />
        Projet personnel — non affilié à Valve Corporation.
      </footer>
    </div>
  );
}
