"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, AlertTriangle } from "lucide-react";

function SteamCompleteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ticket = searchParams.get("ticket");

    if (!ticket) {
      setError("Lien de connexion invalide ou expiré.");
      return;
    }

    signIn("steam-ticket", {
      ticket,
      redirect: false,
      callbackUrl: "/dashboard",
    })
      .then((result) => {
        if (result?.error) {
          setError(
            "La connexion a expiré avant d’être finalisée. Merci de réessayer."
          );
          return;
        }

        router.replace("/dashboard");
      })
      .catch(() => {
        setError("Une erreur inattendue est survenue.");
      });
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel flex max-w-sm flex-col items-center gap-3 p-8 text-center">
        {error ? (
          <>
            <AlertTriangle className="h-6 w-6 text-danger" />

            <p className="text-sm text-slate-300">{error}</p>

            <a
              href="/login"
              className="mt-2 text-sm font-semibold text-steam hover:underline"
            >
              Retourner à la connexion
            </a>
          </>
        ) : (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-steam" />

            <p className="text-sm text-slate-300">
              Finalisation de ta connexion Steam…
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function SteamCompleteLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel flex max-w-sm flex-col items-center gap-3 p-8 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-steam" />

        <p className="text-sm text-slate-300">
          Chargement de la connexion Steam…
        </p>
      </div>
    </div>
  );
}

export default function SteamCompletePage() {
  return (
    <Suspense fallback={<SteamCompleteLoading />}>
      <SteamCompleteContent />
    </Suspense>
  );
}