# FULLCLEAR V7 — Profil, rangs, badges et Hunt quotidienne

Copie tout le contenu de ce dossier à la racine de ton projet et accepte le remplacement des fichiers.

Puis exécute :

```bash
npm run build
git add .
git commit -m "FULLCLEAR V7 profile hunt ranks badges"
git pull --rebase origin main
git push origin main
```

## Inclus

- Fenêtre déplaçable `FULLCLEAR PROFILE`
- Page `/profile`
- Pseudo et avatar Steam réels
- XP rétroactive selon les succès et les jeux à 100 %
- 1 000 niveaux de profil
- 30 familles de rangs Hunt × 5 divisions, puis prestige infini
- 30 emblèmes de rang en SVG
- 24 badges SVG
- Une Hunt classée par jour
- Jeu aléatoire selon Solo / En ligne / Solo + En ligne / Tous
- Choix de 3 objectifs parmi 5
- Synchronisation Steam pour vérifier automatiquement les objectifs
- Points Hunt, XP, séries et historique stockés dans le stockage PostgreSQL existant

Le stockage conserve le système JSONB actuel : aucune migration SQL manuelle n'est nécessaire.
