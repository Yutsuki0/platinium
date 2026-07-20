MISE À JOUR — OBJECTIFS PERSONNELS

Installation :
1. Arrête le serveur avec Ctrl + C.
2. Copie le dossier src dans ton projet et accepte les remplacements.
3. Ne supprime pas ton dossier data.
4. Relance avec npm run dev.

Ajouts :
- Nouvelle page /objectives accessible dans le menu.
- Ajout d’un jeu aux objectifs depuis sa fiche.
- Statut : En cours, En pause ou Terminé.
- Priorité : Faible, Normale ou Haute.
- Date cible facultative.
- Note personnelle jusqu’à 500 caractères.
- Progression et succès restants affichés dans la page Objectifs.
- Données sauvegardées automatiquement dans data/store.json.
- Compatibilité avec les anciens store.json : le tableau gameObjectives est créé automatiquement.

Le projet a été vérifié avec TypeScript sans erreur.
