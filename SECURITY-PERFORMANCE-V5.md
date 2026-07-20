# PLATINUM.EXE — Correctif performance et sécurité V5

## Performance

- Déplacement des fenêtres via `transform: translate3d()` au lieu de modifier `left/top` à chaque mouvement.
- Mouvements et redimensionnements limités à une mise à jour par image avec `requestAnimationFrame`.
- Sauvegarde du layout retardée de 120 ms pour éviter les écritures répétées dans `localStorage`.
- Suppression des flous `backdrop-filter` les plus coûteux.
- Suppression du `will-change` permanent.
- Fond Matrix statique réduit de 26 à 8 lignes, sans intervalle React ni animations continues.
- `content-visibility: auto` sur les gros panneaux hors écran.

## Sécurité

- En-têtes CSP, HSTS, anti-iframe, `nosniff`, politique de permissions et retrait de `X-Powered-By`.
- Route de clé Steam désormais réservée aux utilisateurs connectés.
- Vérification de l'origine pour les modifications de clé Steam.
- Cookie de clé Steam `HttpOnly`, `Secure` en production, `SameSite=Strict`, durée limitée à 30 jours.
- Refus d'une clé de chiffrement par défaut en production.
- Session NextAuth réduite de 365 à 30 jours.
- Les erreurs internes du callback Steam ne sont plus affichées dans l'URL publique.

## Important

Ne mets jamais `.env.local`, `NEXTAUTH_SECRET`, `DATABASE_URL` ou une clé Steam dans GitHub. Le `.gitignore` actuel les exclut déjà, mais vérifie avec `git status` avant chaque commit.
