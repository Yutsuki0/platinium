import Link from "next/link";
import { AlertTriangle, ShieldCheck, Eye } from "lucide-react";
import { cookies } from "next/headers";
import { SteamApiKeyForm } from "@/components/settings/SteamApiKeyForm";
import { steamApiKeyCookieName } from "@/lib/steam/api-key";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const configured = Boolean(cookies().get(steamApiKeyCookieName)?.value || process.env.STEAM_API_KEY);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-12">
      <div className="glass-panel-strong w-full max-w-md p-8 text-center">
        <p className="text-xs uppercase tracking-widest text-steam/80">
          Connexion
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-white">
          Connecte ton compte Steam
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Aucune information sensible n&apos;est demandée : la connexion passe
          entièrement par Steam.
        </p>

        {searchParams.error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-left text-sm text-danger">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{searchParams.error}</p>
          </div>
        )}

        <a
          href="/api/steam/login"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#062012] px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-[#0b3a22]"
        >
          <SteamGlyph />
          Se connecter avec Steam
        </a>

        <p className="mt-4 text-[11px] text-slate-500">
          Nous ne demandons, ne stockons et n&apos;affichons jamais ton mot de
          passe Steam.
        </p>
      </div>

      <div className="w-full max-w-md"><SteamApiKeyForm configured={configured} /></div>

      <div className="glass-panel w-full max-w-md p-6">
        <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-white">
          <Eye className="h-4 w-4 text-warn" />
          Ton profil doit être public
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Pour récupérer tes jeux, temps de jeu et succès, ton{" "}
          <strong className="text-slate-300">profil Steam</strong> et tes{" "}
          <strong className="text-slate-300">détails de jeu</strong> doivent
          être réglés sur « Public ».
        </p>
        <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs text-slate-500">
          <li>Ouvre Steam → ton profil → Modifier le profil</li>
          <li>Onglet « Confidentialité »</li>
          <li>
            Passe « Statut du profil » et « Détails du jeu » sur « Public »
          </li>
        </ol>
      </div>

      <div className="glass-panel flex w-full max-w-md items-start gap-2.5 p-4 text-xs text-slate-500">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-unlocked" />
        <p>
          Ta clé personnelle est chiffrée dans un cookie HttpOnly et n&apos;est jamais écrite dans le dépôt GitHub.{" "}
          <Link href="/" className="text-steam hover:underline">
            Retour à l&apos;accueil
          </Link>
        </p>
      </div>
    </div>
  );
}

function SteamGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-9.95 9.06l5.36 2.22a2.84 2.84 0 0 1 1.62-.5c.06 0 .11 0 .17.01l2.38-3.45v-.05a3.61 3.61 0 1 1 3.61 3.61h-.08l-3.4 2.43c0 .05.01.1.01.15a2.84 2.84 0 0 1-5.63.58L2.14 14.4A10 10 0 1 0 12 2Zm-2.87 14.32-1.23-.51a2.14 2.14 0 0 0 2.02 1.45 2.13 2.13 0 0 0 2.13-2.13 2.16 2.16 0 0 0-.08-.58l-1.19-.49a1.2 1.2 0 0 1 .04.31 1.28 1.28 0 1 1-1.7-1.05Zm7.35-5.87a2.41 2.41 0 1 1 2.41 2.41 2.41 2.41 0 0 1-2.41-2.41Z" />
    </svg>
  );
}
