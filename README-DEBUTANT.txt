STEAM PLATINUM TRACKER - VERSION SIMPLE JSON

Cette version n'utilise PAS Docker, PostgreSQL ou Prisma.
Les informations sont enregistrées dans data/store.json.

1) Ouvre ce dossier dans Visual Studio Code.
2) Dans le terminal, tape : npm install
3) Duplique .env.example et appelle la copie .env
4) Remplis STEAM_API_KEY et NEXTAUTH_SECRET dans .env
5) Tape : npm run dev
6) Ouvre http://localhost:3000

Pour obtenir STEAM_API_KEY :
https://steamcommunity.com/dev/apikey
Dans Domain Name, tu peux écrire : localhost

Important : ton profil Steam et les détails de tes jeux doivent être publics.
