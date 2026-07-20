# Stockage permanent multi-utilisateur

PLATINUM // OS utilise PostgreSQL dès que `DATABASE_URL` est définie. Les profils Steam, jeux, succès, favoris, objectifs et historiques restent alors enregistrés sur le serveur entre deux visites et entre deux redéploiements.

## Variables à ajouter dans `.env.local`

```env
DATABASE_URL=postgresql://utilisateur:mot_de_passe@serveur:5432/base
DATABASE_SSL=true
DATABASE_POOL_SIZE=5
```

Ne mets jamais cette URL dans GitHub. Sur Vercel, Railway, Render, Neon ou Supabase, ajoute-la dans les variables d'environnement du projet.

Au premier démarrage, la table `platinum_app_store` est créée automatiquement. Si un ancien `data/store.json` existe, il est importé automatiquement lors de l'initialisation d'une base vide.

Sans `DATABASE_URL`, le site continue de fonctionner en local avec `data/store.json`. Pour un site public, PostgreSQL est fortement recommandé.
