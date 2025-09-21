# Arqova

## Points importants (prod)

- Webflow/JS animations: s'assurer que la home charge bien le script depuis l'emplacement buildé.
  - Dans `index.html`, utiliser:
    - `<script src="dist/js/webflow.js" type="text/javascript"></script>`
  - Raison: Vite/Vercel sert `webflow.js` sous `dist/js/`. Si le fichier n'est pas chargé, les interactions (scroll/hover, timeline, portfolio) ne s'initialisent pas.
  - jQuery: garder le CDN Webflow d'origine avant `webflow.js`.

## Déploiement Vercel (Front + API serverless)

1. Variables d'environnement à définir dans Vercel:
   - `ADMIN_CODE`: code d'accès pour l'admin
   - `JWT_SECRET`: secret pour signer le cookie
   - `BLOB_READ_WRITE_TOKEN`: token Vercel Blob (si utilisé)
   - `ARTICLE_TTL_DAYS`: (optionnel) nombre de jours avant purge auto via cron

2. Routes API:
   - `POST /api/login` -> vérifie `ADMIN_CODE`, pose un cookie HttpOnly `auth`
   - `GET /api/articles` -> liste les articles (Vercel Blob)
   - `POST /api/articles` -> publie un article JSON (+ image de couverture base64 optionnelle). Champs supportés:
     - `title` (obligatoire), `content` (HTML, obligatoire)
     - `excerpt`, `category`, `author`, `readTime`, `tags` (string ou array), `published`
   - `GET /api/articles/[slug]` -> retourne l'URL publique du JSON
   - `POST /api/upload-image` -> upload image depuis dataURL -> URL publique
   - `POST /api/logout` -> supprime le cookie `auth`
   - `GET /api/cron` -> purge des anciens articles (utilisé par cron Vercel)

3. Front:
   - `index.html`: script `dist/js/webflow.js`
   - `admin-blog.html` consomme `/api/login`, `/api/articles`, `/api/upload-image`
   - `blog.html` et `article.html` lisent les articles via `/api/articles`
 
4. Étapes Vercel:
   1) Créer un projet Vercel depuis ce repo
   2) Ajouter les variables d'env ci-dessus
   3) Activer Vercel Blob (Storage)
   4) Déployer; vérifier `/admin-blog.html` pour publier
   5) (Optionnel) Configurer le cron (déjà dans `vercel.json`)
