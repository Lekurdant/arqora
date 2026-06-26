export const config = {
    // Intercepte l'URL propre /article/slug ET l'URL réelle utilisée partout : /article.html?slug=...
    matcher: ['/article/:slug*', '/article.html'],
};

export default async function middleware(req) {
    const url = new URL(req.url);
    // Slug depuis ?slug=... (URL article.html?slug=) sinon depuis le chemin (URL propre /article/...)
    const slug = url.searchParams.get('slug') || url.pathname.split('/').pop();
    const userAgent = req.headers.get('user-agent') || '';

    // Liste des robots à intercepter : moteurs + réseaux sociaux + IA (GPT, Claude, Perplexity, etc.)
    const isBot = /googlebot|bingbot|yandexbot|duckduckbot|slurp|twitterbot|facebookexternalhit|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator|discordbot|gptbot|oai-searchbot|chatgpt-user|claudebot|claude-web|anthropic-ai|perplexitybot|perplexity-user|ccbot|google-extended|bytespider|amazonbot|applebot|cohere-ai|meta-externalagent|duckassistbot/i.test(userAgent);

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
        const image = article.coverUrl || 'https://raw.githubusercontent.com/Lekurdant/arqora/main/images/arqova-lg-dark1.png';
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

        // Canonical : l'adresse officielle de la page (auto-référence sur l'URL réellement explorée)
        html = html.replace(/href="" id="canonical-url"/, `href="${url.href}" id="canonical-url"`);

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

        // Détection et génération du schema FAQPage si FAQ détectée dans le contenu
        const faqMatch = article.content.match(/<dl>([\s\S]*?)<\/dl>/);
        if (faqMatch) {
            const faqEntries = [];
            const dtMatches = [...faqMatch[1].matchAll(/<dt><strong>(.*?)<\/strong><\/dt>/g)];
            const ddMatches = [...faqMatch[1].matchAll(/<dd>(.*?)<\/dd>/g)];

            for (let i = 0; i < Math.min(dtMatches.length, ddMatches.length); i++) {
                faqEntries.push({
                    "@type": "Question",
                    "name": dtMatches[i][1].replace(/<[^>]*>/g, ''),
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": ddMatches[i][1].replace(/<[^>]*>/g, '')
                    }
                });
            }

            if (faqEntries.length > 0) {
                const faqSchema = {
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    "mainEntity": faqEntries
                };

                // Injecter le schema FAQ juste après le schema BlogPosting
                html = html.replace(
                    /(<script type="application\/ld\+json" id="structured-data">.*?<\/script>)/,
                    `$1\n    <script type="application/ld+json" id="faq-schema">${JSON.stringify(faqSchema)}</script>`
                );
            }
        }

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
