# Publication GitHub et mise en ligne

## Avant le premier commit

Ne publie jamais `.env` ni `data/store.json`. Ils sont ignorés par `.gitignore`.
Le dépôt doit contenir uniquement `.env.example`.

## Variables à configurer chez l'hébergeur

- `NEXTAUTH_URL` : URL finale du site
- `NEXTAUTH_SECRET` : chaîne aléatoire longue
- `STEAM_API_KEY` : facultative. Laisse-la vide pour que chaque utilisateur ajoute sa propre clé depuis l'interface.

## Limite importante du stockage JSON

Le fichier `data/store.json` convient au développement local et à une petite instance auto-hébergée persistante. Vercel et la plupart des hébergeurs serverless ne garantissent pas la persistance des fichiers écrits pendant l'exécution.

Pour un vrai service multi-utilisateur public, remplace le stockage JSON par PostgreSQL, Supabase ou Neon. L'interface BYOK et les routes Steam sont déjà séparées du stockage pour faciliter cette migration.

## Instant Gaming

Les boutons génèrent une recherche vers Instant Gaming. Le tracker ne connaît pas automatiquement les DLC possédés avec l'endpoint de bibliothèque actuellement utilisé. Vérifie toujours le contenu, la région et la plateforme avant achat.
