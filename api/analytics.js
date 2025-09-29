import jwt from 'jsonwebtoken';

function requireAdmin(req) {
  try {
    const cookie = req.headers.cookie || '';
    const match = cookie.match(/(?:^|; )auth=([^;]+)/);
    if (!match) return false;
    const token = decodeURIComponent(match[1]);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return false;
    jwt.verify(token, jwtSecret);
    return true;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Vérifier l'authentification admin
  if (!requireAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Pour l'instant, on retourne des données de démonstration
    // Plus tard, on connectera l'API Google Analytics réelle
    
    const today = new Date();
    const last7Days = [];
    
    // Générer des données de démonstration pour les 7 derniers jours
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      last7Days.push({
        date: date.toISOString().split('T')[0],
        visitors: Math.floor(Math.random() * 50) + 20,
        pageViews: Math.floor(Math.random() * 100) + 40
      });
    }

    // Données de démonstration
    const analyticsData = {
      // Statistiques générales
      visitorsToday: Math.floor(Math.random() * 30) + 20,
      pageViewsToday: Math.floor(Math.random() * 60) + 40,
      avgTimeOnSite: '2m 30s',
      bounceRate: '35%',
      
      // Évolution 7 jours
      last7Days: last7Days,
      
      // Pages populaires
      topPages: [
        { name: 'Page d\'accueil', views: 67 },
        { name: 'Blog', views: 45 },
        { name: 'Article "IA 2025"', views: 23 },
        { name: 'Article "Nocode"', views: 18 },
        { name: 'Contact', views: 12 }
      ],
      
      // Géographie
      countries: [
        { name: 'France', percentage: 78 },
        { name: 'Belgique', percentage: 12 },
        { name: 'Suisse', percentage: 8 },
        { name: 'Autres', percentage: 2 }
      ],
      
      // Appareils
      devices: [
        { name: 'Mobile', percentage: 65 },
        { name: 'Desktop', percentage: 30 },
        { name: 'Tablet', percentage: 5 }
      ],
      
      // Temps réel
      realTime: {
        activeUsers: Math.floor(Math.random() * 5) + 1,
        currentHourViews: Math.floor(Math.random() * 20) + 5
      }
    };

    return res.status(200).json(analyticsData);
  } catch (error) {
    console.error('Analytics API error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
