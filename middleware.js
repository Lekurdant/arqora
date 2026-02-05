export const config = {
  matcher: '/article/:slug*',
};

export default async function middleware(req) {
  const url = new URL(req.url);
  const slug = url.pathname.split('/').pop();
  const userAgent = req.headers.get('user-agent') || '';
  
  // Liste des robots à intercepter
  const isBot = /googlebot|bingbot|yandexbot|duckduckbot|slurp|twitterbot|facebookexternalhit|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator|discordbot/i.test(userAgent);

  // Si ce n'est pas un bot ou pas une route d'article, on laisse passer
  if (!isBot || !slug || slug === 'article.html') {
    return;
  }

  try {
    // 1. Récupérer les données de l'article depuis l'API interne
    // Note: En middleware Vercel, on utilise l'URL complète
    const apiUrl = `${url.origin}/api/articles/${slug}`;
    const apiRes = await fetch(apiUrl);
    
    if (!apiRes.ok) return;
    
    const info = await apiRes.json();
    if (!info.url) return;
    
    // 2. Récupérer le contenu JSON réel de l'article (GitHub)
    const articleRes = await fetch(info.url);
    if (!articleRes.ok) return;
    
    const article = await articleRes.json();
    const publishedDate = article.publishedAt || article.createdAt || new Date().toISOString();
    const description = article.excerpt ? article.excerpt.substring(0, 160) : `Découvrez ${article.title} sur Arqova.`;
    const image = article.coverUrl || 'https://raw.githubusercontent.com/Lekur/arqora/main/images/arqova-lg-dark1.png';
    const tags = Array.isArray(article.tags) ? article.tags.join(', ') : (article.tags || '');

    // 3. Récupérer le fichier article.html original
    const htmlRes = await fetch(`${url.origin}/article.html`);
    if (!htmlRes.ok) return;
    
    let html = await htmlRes.text();

    // 4. Injecter les métadonnées dans le HTML
    // On remplace les balises vides ou génériques par les données de l'article
    html = html.replace(/<title id="page-title">.*?<\/title>/, `<title>${article.title} - Arqova</title>`);
    html = html.replace(/id="meta-description" content=""/, `id="meta-description" content="${description.replace(/"/g, '&quot;')}"`);
    html = html.replace(/id="meta-keywords" content=""/, `id="meta-keywords" content="${article.category}, ${tags}, Arqova"`);
    
    // Open Graph
    html = html.replace(/id="og-url" content=""/, `id="og-url" content="${url.href}"`);
    html = html.replace(/id="og-title" content=""/, `id="og-title" content="${article.title.replace(/"/g, '&quot;')}"`);
    html = html.replace(/id="og-description" content=""/, `id="og-description" content="${description.replace(/"/g, '&quot;')}"`);
    html = html.replace(/id="og-image" content=""/, `id="og-image" content="${image}"`);
    html = html.replace(/id="og-updated" content=""/, `id="og-updated" content="${publishedDate}"`);
    
    // Twitter
    html = html.replace(/id="twitter-url" content=""/, `id="twitter-url" content="${url.href}"`);
    html = html.replace(/id="twitter-title" content=""/, `id="twitter-title" content="${article.title.replace(/"/g, '&quot;')}"`);
    html = html.replace(/id="twitter-description" content=""/, `id="twitter-description" content="${description.replace(/"/g, '&quot;')}"`);
    html = html.replace(/id="twitter-image" content=""/, `id="twitter-image" content="${image}"`);

    // Structured Data JSON-LD
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": article.title,
      "description": description,
      "image": image,
      "author": {
        "@type": "Organization",
        "name": article.author || "Arqova",
        "url": "https://arqova.fr"
      },
      "datePublished": publishedDate,
      "dateModified": publishedDate,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": url.href
      }
    };

    html = html.replace(/<script type="application\/ld\+json" id="structured-data">[\s\S]*?<\/script>/, 
      `<script type="application/ld+json" id="structured-data">${JSON.stringify(structuredData)}</script>`);

    // 5. Retourner le HTML modifié avec les bons headers
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'x-middleware-cache': 'no-cache', // Eviter le cache pour le debugging initial
      },
    });

  } catch (error) {
    console.error('Middleware SEO Error:', error);
    // En cas d'erreur, on laisse Vercel servir la page normale (statique)
    return;
  }
}
