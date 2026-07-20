PLATINUM TRACKER — VERSION FINALE

Cette archive contient le projet complet, pas seulement un patch.

Fonctionnalités incluses :
- Connexion Steam OpenID
- Synchronisation de la bibliothèque Steam
- Synchronisation individuelle et globale des succès
- Noms et descriptions françaises officielles demandées à Steam en priorité
- Tableau de bord complet
- Bibliothèque avec recherche, tris, filtres et favoris
- Fiche détaillée de chaque jeu
- Recherche et filtres dans les succès d'un jeu
- Page globale de tous les succès
- Objectifs personnels
- Planificateur par date cible
- Recommandations de jeux à terminer
- Statistiques et graphiques
- Historique des synchronisations
- Paramètres, profil Steam et export JSON
- Interface ordinateur et mobile
- Stockage local dans data/store.json

INSTALLATION
1. Sauvegarde ton ancien fichier data/store.json et ton fichier .env.local.
2. Décompresse cette archive dans un nouveau dossier.
3. Remets ton .env.local à la racine si nécessaire.
4. Pour conserver toutes tes données, remplace data/store.json par ton ancien fichier.
5. Ouvre PowerShell dans le dossier et lance :
   npm install
   npm run dev
6. Ouvre http://localhost:3000

VÉRIFICATION
Le projet a été vérifié avec TypeScript sans erreur.
