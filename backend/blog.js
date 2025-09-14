const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Auth admin basique par jeton Bearer (défini dans backend/.env via ADMIN_TOKEN)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : '';
    if (ADMIN_TOKEN && token === ADMIN_TOKEN) {
      return next();
    }
    return res.status(401).json({ error: 'Non autorisé' });
  } catch (e) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
}

// Configuration de multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/blog';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'));
    }
  }
});

// Fonction pour générer un slug à partir d'un titre
function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9\s-]/g, '') // Supprimer les caractères spéciaux
    .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
    .replace(/-+/g, '-') // Supprimer les tirets doubles
    .replace(/^-|-$/g, ''); // Supprimer les tirets au début et à la fin
}

// Fonction pour s'assurer que le slug est unique
function ensureUniqueSlug(baseSlug, excludeId = null) {
  let slug = baseSlug;
  let counter = 1;
  
  while (articles.some(article => article._id !== excludeId && article.slug === slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

// Modèle d'article en mémoire (à remplacer par MongoDB plus tard)
let articles = [
  {
    _id: '1',
    title: 'Les avantages du No-Code pour les startups en 2024',
    slug: 'avantages-no-code-startups-2024',
    excerpt: 'Découvrez comment le no-code révolutionne le développement web et permet aux startups de lancer leurs projets plus rapidement et à moindre coût.',
    content: `
      <h2>Introduction au No-Code</h2>
      <p>Le no-code est devenu un incontournable pour les startups qui souhaitent innover rapidement. Cette approche permet de créer des applications web sophistiquées sans écrire une seule ligne de code.</p>
      
      <h3>Rapidité de développement</h3>
      <p>L'un des principaux avantages du no-code est la vitesse de développement. Ce qui prenait des mois peut maintenant être réalisé en quelques semaines, voire quelques jours.</p>
      
      <h3>Réduction des coûts</h3>
      <p>En éliminant le besoin de développeurs spécialisés pour chaque aspect du projet, le no-code permet de réduire considérablement les coûts de développement.</p>
      
      <h3>Flexibilité et évolutivité</h3>
      <p>Les plateformes no-code modernes offrent une grande flexibilité et permettent d'évoluer facilement avec les besoins de votre entreprise.</p>
      
      <h2>Cas d'usage concrets</h2>
      <ul>
        <li>Création de MVP (Minimum Viable Product)</li>
        <li>Automatisation des processus métier</li>
        <li>Développement d'applications internes</li>
        <li>Sites e-commerce personnalisés</li>
      </ul>
      
      <h2>Conclusion</h2>
      <p>Le no-code n'est pas seulement une tendance, c'est une révolution qui démocratise le développement web et permet à plus d'entrepreneurs de concrétiser leurs idées.</p>
    `,
    category: 'nocode',
    image: '/images/placeholder-blog.jpg',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    author: 'Lucas Choucroun',
    readTime: '5 min',
    tags: ['no-code', 'startup', 'développement web'],
    published: true
  },
  {
    _id: '2',
    title: 'Guide complet du SEO pour votre site Webflow',
    slug: 'guide-seo-webflow-complet',
    excerpt: 'Optimisez votre site Webflow pour les moteurs de recherche avec nos conseils d\'experts et boostez votre visibilité en ligne.',
    content: `
      <h2>L'importance du SEO pour Webflow</h2>
      <p>Webflow offre d'excellentes capacités SEO natives, mais il est essentiel de les configurer correctement pour maximiser votre visibilité.</p>
      
      <h3>1. Structure et hiérarchie</h3>
      <p>Organisez votre contenu avec une structure claire utilisant les balises H1, H2, H3 de manière logique.</p>
      
      <h3>2. Métadonnées optimisées</h3>
      <p>Chaque page doit avoir un titre unique et une meta description engageante qui incite au clic.</p>
      
      <h3>3. Performance et vitesse</h3>
      <p>Optimisez vos images, utilisez la compression et tirez parti du CDN de Webflow pour des temps de chargement rapides.</p>
      
      <h3>4. Mobile-first</h3>
      <p>Assurez-vous que votre site est parfaitement responsive et offre une excellente expérience sur mobile.</p>
      
      <h2>Checklist SEO Webflow</h2>
      <ul>
        <li>Configuration du sitemap XML</li>
        <li>Mise en place du fichier robots.txt</li>
        <li>Optimisation des images avec alt text</li>
        <li>Utilisation des redirections 301</li>
        <li>Implémentation du schema markup</li>
      </ul>
    `,
    category: 'seo',
    image: '/images/placeholder-blog.jpg',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    author: 'Lucas Choucroun',
    readTime: '7 min',
    tags: ['seo', 'webflow', 'optimisation'],
    published: true
  },
  {
    _id: '3',
    title: 'TypeScript vs JavaScript : Quel choix pour votre projet ?',
    slug: 'typescript-vs-javascript-choix-projet',
    excerpt: 'Analyse comparative entre TypeScript et JavaScript pour vous aider à choisir la meilleure technologie pour votre prochain projet.',
    content: `
      <h2>Introduction</h2>
      <p>Le choix entre TypeScript et JavaScript est crucial pour le succès de votre projet. Explorons les avantages et inconvénients de chaque option.</p>
      
      <h3>JavaScript : La simplicité avant tout</h3>
      <p>JavaScript reste le langage de base du web avec une courbe d'apprentissage plus douce et une flexibilité maximale.</p>
      
      <h3>TypeScript : La sécurité du typage</h3>
      <p>TypeScript apporte le typage statique, réduisant les erreurs et améliorant la maintenabilité du code.</p>
      
      <h2>Critères de choix</h2>
      <ul>
        <li>Taille de l'équipe</li>
        <li>Complexité du projet</li>
        <li>Durée de vie prévue</li>
        <li>Besoins en refactoring</li>
      </ul>
      
      <h2>Recommandations</h2>
      <p>Pour des projets complexes avec plusieurs développeurs, TypeScript est souvent le meilleur choix. Pour des prototypes rapides, JavaScript peut suffire.</p>
    `,
    category: 'dev',
    image: '/images/placeholder-blog.jpg',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25'),
    author: 'Ehua Kassi',
    readTime: '6 min',
    tags: ['typescript', 'javascript', 'développement'],
    published: true
  },
  {
    _id: '4',
    title: 'Créer un e-commerce moderne avec Stripe et Webflow',
    slug: 'ecommerce-moderne-stripe-webflow',
    excerpt: 'Apprenez à intégrer Stripe dans votre site Webflow pour créer une boutique en ligne professionnelle et sécurisée.',
    content: `
      <h2>Pourquoi choisir Stripe pour votre e-commerce ?</h2>
      <p>Stripe est la solution de paiement préférée des développeurs pour sa simplicité d'intégration et sa sécurité de niveau mondial.</p>
      
      <h3>Intégration avec Webflow</h3>
      <p>L'intégration de Stripe avec Webflow permet de créer des expériences d'achat fluides sans compromettre le design.</p>
      
      <h3>Sécurité et conformité</h3>
      <p>Stripe gère automatiquement la conformité PCI DSS et la sécurité des données de paiement.</p>
      
      <h2>Étapes d'implémentation</h2>
      <ol>
        <li>Configuration du compte Stripe</li>
        <li>Intégration des webhooks</li>
        <li>Création des formulaires de paiement</li>
        <li>Gestion des commandes</li>
        <li>Tests et mise en production</li>
      </ol>
      
      <h2>Bonnes pratiques</h2>
      <ul>
        <li>Utiliser HTTPS partout</li>
        <li>Implémenter la validation côté client et serveur</li>
        <li>Gérer les erreurs de paiement</li>
        <li>Optimiser pour le mobile</li>
      </ul>
    `,
    category: 'dev',
    image: '/images/placeholder-blog.jpg',
    createdAt: new Date('2024-01-30'),
    updatedAt: new Date('2024-01-30'),
    author: 'Ehua Kassi',
    readTime: '8 min',
    tags: ['stripe', 'ecommerce', 'webflow', 'paiement'],
    published: true
  },
  {
    _id: '5',
    title: 'Tendances UX/UI Design 2024 : Ce qui va marquer l\'année',
    slug: 'tendances-ux-ui-design-2024',
    excerpt: 'Découvrez les tendances design qui vont dominer 2024 et comment les intégrer dans vos projets pour rester à la pointe.',
    content: `
      <h2>Les tendances qui marquent 2024</h2>
      <p>Cette année, le design évolue vers plus de simplicité et d'accessibilité tout en intégrant des technologies émergentes.</p>
      
      <h3>1. Minimalisme fonctionnel</h3>
      <p>Le minimalisme ne signifie pas simplicité extrême, mais plutôt une approche réfléchie qui met l'accent sur la fonctionnalité.</p>
      
      <h3>2. Dark mode par défaut</h3>
      <p>Le mode sombre devient la norme plutôt que l'exception, offrant une meilleure expérience utilisateur et économisant la batterie.</p>
      
      <h3>3. Micro-interactions avancées</h3>
      <p>Les micro-interactions deviennent plus sophistiquées et contribuent significativement à l'expérience utilisateur.</p>
      
      <h3>4. Accessibilité inclusive</h3>
      <p>L'accessibilité n'est plus une option mais une nécessité, intégrée dès la conception.</p>
      
      <h2>Technologies émergentes</h2>
      <ul>
        <li>IA générative pour le design</li>
        <li>Réalité augmentée dans les interfaces</li>
        <li>Voice UI et interfaces conversationnelles</li>
        <li>Design system automatisés</li>
      </ul>
      
      <h2>Conseils d'implémentation</h2>
      <p>Pour rester compétitif, intégrez progressivement ces tendances en gardant toujours l'utilisateur au centre de vos décisions.</p>
    `,
    category: 'design',
    image: '/images/placeholder-blog.jpg',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    author: 'Lucas Choucroun',
    readTime: '6 min',
    tags: ['ux', 'ui', 'design', 'tendances'],
    published: true
  },
  {
    _id: '6',
    title: 'API REST vs GraphQL : Quelle architecture pour votre projet ?',
    slug: 'api-rest-vs-graphql-architecture',
    excerpt: 'Comparaison détaillée entre REST et GraphQL pour vous aider à choisir la meilleure architecture API pour votre application.',
    content: `
      <h2>REST : La référence éprouvée</h2>
      <p>REST (Representational State Transfer) reste l'architecture API la plus utilisée grâce à sa simplicité et sa maturité.</p>
      
      <h3>Avantages de REST</h3>
      <ul>
        <li>Simplicité conceptuelle</li>
        <li>Cache HTTP natif</li>
        <li>Tooling mature</li>
        <li>Stateless par nature</li>
      </ul>
      
      <h2>GraphQL : La flexibilité nouvelle génération</h2>
      <p>GraphQL permet aux clients de demander exactement les données dont ils ont besoin, réduisant le sur-fetching et sous-fetching.</p>
      
      <h3>Avantages de GraphQL</h3>
      <ul>
        <li>Requêtes flexibles</li>
        <li>Typage fort</li>
        <li>Introspection automatique</li>
        <li>Versionning simplifié</li>
      </ul>
      
      <h2>Critères de choix</h2>
      <p>Le choix dépend de votre équipe, de la complexité de vos données et de vos besoins en performance.</p>
      
      <h3>Choisir REST si :</h3>
      <ul>
        <li>Équipe peu familière avec GraphQL</li>
        <li>API simple avec peu de relations</li>
        <li>Besoin de cache HTTP agressif</li>
        <li>Intégration avec des systèmes legacy</li>
      </ul>
      
      <h3>Choisir GraphQL si :</h3>
      <ul>
        <li>Données complexes avec beaucoup de relations</li>
        <li>Multiples clients avec des besoins différents</li>
        <li>Équipe expérimentée</li>
        <li>Besoin de rapidité de développement frontend</li>
      </ul>
    `,
    category: 'dev',
    image: '/images/placeholder-blog.jpg',
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-05'),
    author: 'Ehua Kassi',
    readTime: '10 min',
    tags: ['api', 'rest', 'graphql', 'backend'],
    published: true
  }
];

// Routes API

// Récupérer tous les articles avec pagination et filtres
router.get('/articles', (req, res) => {
  try {
    const { page = 1, limit = 9, category, search, exclude } = req.query;
    const startIndex = (page - 1) * limit;
    
    // Filtrer les articles
    let filteredArticles = articles.filter(article => article.published);
    
    if (category && category !== 'all') {
      filteredArticles = filteredArticles.filter(article => article.category === category);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredArticles = filteredArticles.filter(article => 
        article.title.toLowerCase().includes(searchLower) ||
        article.excerpt.toLowerCase().includes(searchLower) ||
        article.content.toLowerCase().includes(searchLower)
      );
    }
    
    if (exclude) {
      filteredArticles = filteredArticles.filter(article => article._id !== exclude);
    }
    
    // Trier par date de création (plus récent en premier)
    filteredArticles.sort((a, b) => b.createdAt - a.createdAt);
    
    // Pagination
    const paginatedArticles = filteredArticles.slice(startIndex, startIndex + parseInt(limit));
    
    res.json({
      articles: paginatedArticles,
      total: filteredArticles.length,
      page: parseInt(page),
      hasMore: startIndex + parseInt(limit) < filteredArticles.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des articles' });
  }
});

// Récupérer un article par slug (DOIT être avant la route :id)
router.get('/articles/slug/:slug', (req, res) => {
  try {
    const article = articles.find(a => a.slug === req.params.slug);
    
    if (!article) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }
    
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'article' });
  }
});

// Récupérer un article par ID
router.get('/articles/:id', (req, res) => {
  try {
    const article = articles.find(a => a._id === req.params.id);
    
    if (!article) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }
    
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'article' });
  }
});

// Créer un nouvel article (avec authentification admin)
router.post('/articles', requireAdmin, upload.single('image'), (req, res) => {
  try {
    // Vérifier l'authentification admin (à implémenter)
    // if (!req.isAdmin) {
    //   return res.status(401).json({ error: 'Non autorisé' });
    // }
    
    // Générer le slug automatiquement
    const baseSlug = generateSlug(req.body.title);
    const slug = ensureUniqueSlug(baseSlug);
    
    const newArticle = {
      _id: Date.now().toString(),
      ...req.body,
      slug: slug,
      image: req.file ? `/uploads/blog/${req.file.filename}` : '/images/placeholder-blog.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
      published: req.body.published === 'true'
    };
    
    articles.push(newArticle);
    res.status(201).json(newArticle);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création de l\'article' });
  }
});

// Mettre à jour un article
router.put('/articles/:id', requireAdmin, upload.single('image'), (req, res) => {
  try {
    // Vérifier l'authentification admin
    // if (!req.isAdmin) {
    //   return res.status(401).json({ error: 'Non autorisé' });
    // }
    
    const articleIndex = articles.findIndex(a => a._id === req.params.id);
    
    if (articleIndex === -1) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }
    
    const updatedArticle = {
      ...articles[articleIndex],
      ...req.body,
      updatedAt: new Date()
    };
    
    // Régénérer le slug si le titre a changé
    if (req.body.title && req.body.title !== articles[articleIndex].title) {
      const baseSlug = generateSlug(req.body.title);
      updatedArticle.slug = ensureUniqueSlug(baseSlug, req.params.id);
    }
    
    if (req.file) {
      updatedArticle.image = `/uploads/blog/${req.file.filename}`;
    }
    
    if (req.body.published !== undefined) {
      updatedArticle.published = req.body.published === 'true';
    }
    
    articles[articleIndex] = updatedArticle;
    res.json(updatedArticle);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'article' });
  }
});

// Supprimer un article
router.delete('/articles/:id', requireAdmin, (req, res) => {
  try {
    // Vérifier l'authentification admin
    // if (!req.isAdmin) {
    //   return res.status(401).json({ error: 'Non autorisé' });
    // }
    
    const articleIndex = articles.findIndex(a => a._id === req.params.id);
    
    if (articleIndex === -1) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }
    
    articles.splice(articleIndex, 1);
    res.json({ message: 'Article supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'article' });
  }
});

// Route pour récupérer les catégories disponibles
router.get('/categories', (req, res) => {
  const categories = [
    { value: 'nocode', label: 'No-Code' },
    { value: 'dev', label: 'Développement' },
    { value: 'design', label: 'Design' },
    { value: 'seo', label: 'SEO' }
  ];
  
  res.json(categories);
});

// Route pour l'upload d'images dans l'éditeur
router.post('/upload-image', requireAdmin, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucune image fournie' });
    }
    
    // Retourner l'URL de l'image uploadée
    res.json({
      location: `/uploads/blog/${req.file.filename}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'upload de l\'image' });
  }
});

module.exports = router; 