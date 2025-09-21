// Données structurées Schema.org pour le SEO
function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Arqova",
    "url": "https://arqova.fr",
    "logo": "https://arqova.fr/images/logo.png",
    "description": "Agence de développement web spécialisée en Next.js, TypeScript et Tailwind CSS",
    "foundingDate": "2024",
    "founders": [
      {
        "@type": "Person",
        "name": "Lucas Choucroun",
        "jobTitle": "Lead Frontend Developer"
      },
      {
        "@type": "Person", 
        "name": "Ehua Kassi",
        "jobTitle": "Senior Backend Developer"
      }
    ],
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "FR"
    },
    "sameAs": [
      "https://github.com/arqova",
      "https://linkedin.com/company/arqova"
    ]
  };
}

function generateArticleSchema(article) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.metaDescription || article.excerpt,
    "image": article.coverUrl,
    "author": {
      "@type": "Person",
      "name": article.author || "Arqova"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Arqova",
      "logo": {
        "@type": "ImageObject",
        "url": "https://arqova.fr/images/logo.png"
      }
    },
    "datePublished": article.publishedAt,
    "dateModified": article.updatedAt || article.publishedAt,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://arqova.fr/article/${article.slug}`
    },
    "keywords": article.tags ? article.tags.join(", ") : "",
    "articleSection": article.category || "Développement Web"
  };
}

function generateBreadcrumbSchema(breadcrumbs) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

// Fonction pour injecter les données structurées dans le DOM
function injectSchema(schema) {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

// Export pour utilisation dans les pages
window.SchemaUtils = {
  generateOrganizationSchema,
  generateArticleSchema,
  generateBreadcrumbSchema,
  injectSchema
};
