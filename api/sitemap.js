import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Récupérer tous les articles
    const { data: articles } = await octokit.rest.repos.getContent({
      owner: 'Lekurdant',
      repo: 'arqora',
      path: 'articles',
    });

    if (!Array.isArray(articles)) {
      return res.status(404).json({ error: 'Articles not found' });
    }

    // Construire le sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  
  <!-- Page d'accueil -->
  <url>
    <loc>https://arqova.fr/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Page blog -->
  <url>
    <loc>https://arqova.fr/blog.html</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;

    // Ajouter chaque article
    for (const article of articles) {
      if (article.type === 'file' && article.name.endsWith('.json')) {
        try {
          // Récupérer le contenu de l'article
          const { data: articleContent } = await octokit.rest.repos.getContent({
            owner: 'Lekurdant',
            repo: 'arqora',
            path: article.path,
          });

          const articleData = JSON.parse(Buffer.from(articleContent.content, 'base64').toString());
          const slug = article.name.replace('.json', '');
          const articleUrl = `https://arqova.fr/article.html?slug=${slug}`;
          
          // Date de publication
          const publishedDate = articleData.publishedAt || articleData.createdAt || new Date().toISOString();
          
          sitemap += `
  <!-- Article: ${articleData.title} -->
  <url>
    <loc>${articleUrl}</loc>
    <lastmod>${publishedDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <news:news>
      <news:publication>
        <news:name>Arqova</news:name>
        <news:language>fr</news:language>
      </news:publication>
      <news:publication_date>${publishedDate}</news:publication_date>
      <news:title>${articleData.title}</news:title>
    </news:news>`;

          // Ajouter l'image de couverture si elle existe
          if (articleData.coverUrl) {
            sitemap += `
    <image:image>
      <image:loc>${articleData.coverUrl}</image:loc>
      <image:title>${articleData.title}</image:title>
    </image:image>`;
          }

          sitemap += `
  </url>`;
        } catch (error) {
          console.error(`Erreur lors du traitement de l'article ${article.name}:`, error);
        }
      }
    }

    // Fermer le sitemap
    sitemap += `
</urlset>`;

    // Définir les headers pour XML
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache 1 heure
    res.status(200).send(sitemap);

  } catch (error) {
    console.error('Erreur lors de la génération du sitemap:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du sitemap' });
  }
}
