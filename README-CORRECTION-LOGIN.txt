CORRECTION PRINCIPALE DE CETTE VERSION

L'erreur HTTP 500 sur /api/steam/login venait du fait que l'ancienne version
exigeait STEAM_OPENID_REALM et STEAM_OPENID_RETURN_URL sans les fournir dans
.env.example.

Cette version calcule automatiquement :
- le realm Steam OpenID ;
- l'URL de callback ;
- l'origine locale ou publique du site.

Test effectué en local :
- GET /api/health => 200
- GET /api/steam/login => 307 vers Steam avec le bon callback localhost
- vérification TypeScript => aucune erreur

INSTALLATION
1. Copier .env.example vers .env.local
2. Générer NEXTAUTH_SECRET comme indiqué dans INSTALLATION.txt
3. npm install
4. npm run dev
