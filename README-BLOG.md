# Guide d'utilisation du Blog Nocodebaby

## Vue d'ensemble

Le système de blog Nocodebaby est conçu pour améliorer le référencement naturel (SEO) du site en publiant régulièrement du contenu de qualité sur le développement web, le no-code, le design et le SEO.

## Architecture

### Frontend
- **blog.html** : Page principale du blog avec filtres par catégorie
- **article.html** : Page de lecture d'un article individuel
- **admin-blog.html** : Interface d'administration pour gérer les articles

### Backend
- **api/** : Routes serverless (auth, articles, upload) utilisées par l'admin et le front
- **api/_github.js** : Helper GitHub (listage, lecture, écriture, suppression)

## Fonctionnalités

### Pour les visiteurs
- Navigation par catégories (No-Code, Développement, Design, SEO)
- Pagination avec chargement progressif
- Articles similaires sur chaque page d'article
- Partage sur les réseaux sociaux (LinkedIn, Twitter)
- Design responsive et mode sombre

### Pour l'administration
- Création et édition d'articles avec éditeur WYSIWYG (TinyMCE)
- Upload d'images de couverture
- Gestion des catégories et tags
- Prévisualisation avant publication
- Gestion des brouillons

## Installation et démarrage

### 1. Installation des dépendances

Dépendances (dans le dossier racine) :
```bash
yarn install
```

### 2. Démarrage en local

```bash
yarn dev
```

### 3. Accès aux pages

- Blog public : http://localhost:3000/blog.html
- Administration : http://localhost:3000/admin-blog.html
- API : http://localhost:3000/api/articles

### Stockage via GitHub (GitHub-as-CMS)

Le projet utilise GitHub Contents API pour stocker le contenu:

- `articles/*.json` pour chaque article (métadonnées + contenu HTML)
- `articles/<slug>/cover.<ext>` pour l'image de couverture
- `uploads/*` pour les images insérées via l'éditeur

Variables d'environnement requises:

- `GITHUB_TOKEN`: token PAT avec scope `repo`
- `GITHUB_OWNER`: propriétaire du repo (ex: `your-user` ou `your-org`)
- `GITHUB_REPO`: nom du repo (ex: `content`)
- `GITHUB_BRANCH`: branche cible (défaut: `main`)

Endpoints liés:

- `GET /api/articles` — liste les JSON dans `articles/`
- `POST /api/articles` — crée/met à jour l'article JSON + cover
- `GET /api/articles/[slug]` — renvoie l'URL raw GitHub du JSON
- `DELETE /api/articles/[slug]` — supprime JSON + assets du dossier de l'article
- `POST /api/upload-image` — enregistre l'image dans `uploads/` et renvoie l'URL raw

## Guide d'utilisation de l'administration

### Accéder à l'administration
1. Ouvrez http://localhost:3000/admin-blog.html
2. L'interface se divise en 3 sections : Liste des articles, Nouvel article, Statistiques

### Créer un nouvel article
1. Cliquez sur "Nouvel article" dans la sidebar
2. Remplissez les champs obligatoires :
   - Titre
   - Extrait (résumé court)
   - Catégorie
   - Auteur
   - Contenu (utilisez l'éditeur riche)
3. Ajoutez optionnellement :
   - Image de couverture
   - Temps de lecture
   - Tags (séparés par des virgules)
4. Cochez "Publier l'article" ou laissez décoché pour un brouillon
5. Cliquez sur "Enregistrer"

### Éditer un article existant
1. Dans la liste des articles, cliquez sur "Éditer"
2. Modifiez les champs souhaités
3. Cliquez sur "Enregistrer"

### Supprimer un article
1. Dans la liste des articles, cliquez sur "Supprimer"
2. Confirmez la suppression

## Optimisation SEO

### Bonnes pratiques pour les articles
1. **Titre** : Utilisez des mots-clés pertinents (60-70 caractères)
2. **Extrait** : Résumé accrocheur avec mots-clés (150-160 caractères)
3. **Contenu** :
   - Minimum 800 mots par article
   - Utilisez les balises H2, H3 pour structurer
   - Incluez des mots-clés naturellement
   - Ajoutez des liens internes vers d'autres articles
4. **Images** : 
   - Utilisez des noms de fichiers descriptifs
   - Optimisez la taille (< 200KB idéalement)
   - Format recommandé : WebP ou JPEG optimisé
5. **Tags** : Utilisez 3-5 tags pertinents par article

### Fréquence de publication recommandée
- Minimum : 1 article par semaine
- Idéal : 2-3 articles par semaine
- Variez les catégories pour couvrir tous les aspects

## Structure des données

### Article
```javascript
{
  _id: string,
  title: string,
  excerpt: string,
  content: string (HTML),
  category: 'nocode' | 'dev' | 'design' | 'seo',
  author: string,
  image: string (URL),
  tags: string[],
  readTime: string,
  published: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

- **GET /api/articles** : Liste des articles avec pagination
  - Query params : page, limit, category, search, exclude
- **GET /api/articles/:id** : Récupérer un article par ID
- **POST /api/articles** : Créer un nouvel article
- **PUT /api/articles/:id** : Mettre à jour un article
- **DELETE /api/articles/:id** : Supprimer un article
- **GET /api/categories** : Liste des catégories disponibles
- **POST /api/upload-image** : Upload d'image pour l'éditeur

## Personnalisation

### Ajouter une nouvelle catégorie
1. Modifiez `backend/blog.js` dans la route `/categories`
2. Ajoutez la catégorie dans `blog.html` (filtres)
3. Ajoutez la catégorie dans `admin-blog.html` (formulaire)

### Modifier le style
- Les styles sont dans les balises `<style>` de chaque fichier HTML
- Respectez le thème sombre existant (#0d0d0d fond, #4d65ff accent)

## Maintenance

### Sauvegarde des données
Actuellement, les articles sont stockés en mémoire. Pour une utilisation en production :
1. Intégrez MongoDB ou une autre base de données
2. Sauvegardez régulièrement le dossier `uploads/blog`

### Monitoring
- Vérifiez régulièrement les logs du serveur
- Surveillez l'espace disque pour les uploads
- Analysez les performances avec Google Analytics

## Sécurité

### À implémenter pour la production
1. Authentification admin (JWT ou sessions)
2. Validation des entrées côté serveur
3. Limite de taux sur les API
4. HTTPS obligatoire
5. Protection CSRF
6. Sanitization du HTML dans l'éditeur

## Support

Pour toute question ou problème :
- Lucas Choucroun : Design et No-Code
- Ehua Kassi : Backend et intégrations

---

Bon blogging ! 🚀 