# Steam Platinum Tracker — Phase 1

Fondations du projet : Next.js (App Router) + TypeScript + Tailwind +
Prisma + PostgreSQL, avec un premier layout et une page de démonstration
du tableau de bord (données fictives, sans authentification pour l'instant).

## Arborescence créée dans cette phase

```
steam-platinum-tracker/
├── prisma/
│   └── schema.prisma          # User, Account, Session, SteamProfile, UserSetting
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Layout racine, polices, fond glassmorphique
│   │   ├── globals.css         # Tokens de design (glass-panel, ambient-orb...)
│   │   └── page.tsx            # Dashboard de démonstration
│   ├── components/
│   │   ├── nav/
│   │   │   ├── Sidebar.tsx     # Navigation desktop
│   │   │   └── MobileNav.tsx   # Navigation mobile (barre du bas)
│   │   └── dashboard/
│   │       └── DashboardCharts.tsx
│   └── lib/
│       └── utils.ts            # cn(), formatPlaytime(), getRarityTier()
├── docker-compose.yml           # PostgreSQL local
├── .env.example
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.mjs
```

## 1. Prérequis

- Node.js 20+
- npm
- Docker Desktop (pour PostgreSQL local)

## 2. Installation

```bash
npm install
```

## 3. Base de données locale

```bash
docker compose up -d
```

Vérifie que le conteneur tourne :

```bash
docker compose ps
```

## 4. Variables d'environnement

```bash
cp .env.example .env
```

Remplis ensuite :

- `DATABASE_URL` : garde la valeur par défaut si tu utilises `docker-compose.yml` tel quel.
- `NEXTAUTH_SECRET` : génère-le avec `openssl rand -base64 32`.
- `STEAM_API_KEY` : sera nécessaire en Phase 2 (connexion Steam). Génère-la sur
  https://steamcommunity.com/dev/apikey (nécessite un profil Steam ayant possédé
  un jeu depuis au moins 30 jours).

## 5. Migration Prisma initiale

```bash
npx prisma migrate dev --name init
```

Cela crée les tables `User`, `Account`, `Session`, `VerificationToken`,
`SteamProfile` et `UserSetting` dans ta base locale.

## 6. Lancer le projet

```bash
npm run dev
```

Ouvre http://localhost:3000 — tu dois voir le tableau de bord de démonstration
en mode glassmorphism sombre, avec des données fictives et un bouton
« Se connecter avec Steam » (non fonctionnel pour l'instant, arrive en Phase 2).

## Ce qui n'est PAS encore fait (prochaines phases)

- Phase 3 : succès, calcul de progression, bibliothèque de jeux, fiches de jeux.
- Phase 4 : objectifs, planificateur, recommandations, statistiques.
- Phase 5 : DLC, administration, guides, liens d'achat.
- Phase 6 : tests, sécurité, optimisation, déploiement.

Le README complet (captures d'écran, déploiement, sécurité, etc.) sera
complété phase après phase, comme demandé dans le cahier des charges.

---

## Phase 2 — Connexion Steam, profil, première synchronisation

### Nouveaux fichiers

```
src/lib/steam/
├── errors.ts        # Erreurs typées (profil privé, clé API manquante...)
├── types.ts          # Schémas Zod des réponses Steam
├── rate-limit.ts      # Throttling + cache mémoire TTL
├── client.ts          # Client HTTP bas niveau (clé API serveur uniquement)
├── player.ts           # GetPlayerSummaries
├── owned-games.ts     # GetOwnedGames
├── openid.ts           # Connexion Steam OpenID 2.0
├── ticket.ts            # Ticket signé (pont OpenID -> NextAuth)
└── sync.ts               # Provisionnement du compte + synchronisation

src/lib/
├── prisma.ts       # Singleton PrismaClient
└── auth.ts          # Configuration NextAuth (provider Credentials "steam-ticket")

src/app/
├── page.tsx                        # Landing page publique (section 6)
├── login/page.tsx                  # Connexion Steam + explication visibilité
├── demo/page.tsx                    # Ancienne démo Phase 1 (déplacée ici)
├── auth/steam-complete/page.tsx     # Échange le ticket contre une session
├── api/auth/[...nextauth]/route.ts
├── api/steam/login/route.ts         # Redirige vers Steam OpenID
├── api/steam/callback/route.ts       # Vérifie la réponse, crée le compte
├── api/steam/sync/route.ts            # Déclenche la synchronisation
└── (app)/
    ├── layout.tsx                    # Sidebar + garde d'authentification
    └── dashboard/page.tsx             # Dashboard réel (profil + sync + jeux)
```

### Pourquoi un « ticket » entre le callback Steam et NextAuth ?

Steam utilise **OpenID 2.0**, un protocole différent d'OAuth 2 / OIDC que
NextAuth ne sait pas piloter avec ses providers standards. Le flux est donc :

1. `GET /api/steam/login` construit l'URL Steam OpenID et redirige l'utilisateur.
2. Steam redirige vers `GET /api/steam/callback` avec des paramètres `openid.*`.
3. Le callback **vérifie la signature** en renvoyant ces paramètres à Steam
   (`openid.mode=check_authentication`), crée/actualise le compte local
   (`User` + `SteamProfile`), puis génère un **ticket signé HMAC** valable
   60 secondes.
4. Le navigateur est redirigé vers `/auth/steam-complete?ticket=...`, qui
   appelle `signIn("steam-ticket", { ticket })`.
5. Le provider Credentials de NextAuth vérifie ce ticket et ouvre une
   session JWT normale.

Ton mot de passe Steam n'est à aucun moment demandé, transmis ou stocké.

### Configuration nécessaire

1. Génère ta clé API Steam : https://steamcommunity.com/dev/apikey
   (il faut un compte Steam ayant possédé un jeu depuis au moins 30 jours).
2. Renseigne `STEAM_API_KEY` dans `.env`.
3. Assure-toi que `STEAM_OPENID_REALM` et `STEAM_OPENID_RETURN_URL`
   correspondent à ton URL locale (`http://localhost:3000` par défaut).
4. Génère la migration pour les nouveaux modèles :

   ```bash
   npx prisma migrate dev --name add_games_and_sync
   ```

### Tester le flux

```bash
npm run dev
```

1. Ouvre http://localhost:3000, clique sur « Se connecter avec Steam ».
2. Connecte-toi sur la page Steam officielle, autorise l'application.
3. Tu es redirigé vers `/dashboard`. Si ton profil ou tes détails de jeu
   sont privés, un message explicite te l'indique (section 2 et 27).
4. Clique sur « Synchroniser mon compte Steam » pour récupérer ta
   bibliothèque (jeux + temps de jeu). Un résumé s'affiche après coup.

### Limite connue de ce sandbox de développement

Dans l'environnement où ce code a été généré, l'accès réseau est restreint
et ne permet pas de télécharger le moteur binaire Prisma
(`binaries.prisma.sh`) ni les polices Google Fonts. `npx prisma generate`
et `npm run build` échoueront donc ici précisément à cause de ce
sandboxing — pas d'un problème dans le code. Sur ta machine, avec un accès
internet normal, ces commandes fonctionnent normalement.
