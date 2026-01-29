import jwt from 'jsonwebtoken';
import { google } from 'googleapis';

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
    // Configuration OAuth pour Google Analytics
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'https://arqova.fr'
    );

    // Utiliser les credentials de service
    oauth2Client.setCredentials({
      access_token: process.env.GOOGLE_ACCESS_TOKEN
    });

    const analytics = google.analyticsreporting({ version: 'v4', auth: oauth2Client });

    // 1. Récupérer les données de base (visiteurs, pages vues, temps, rebond)
    const basicData = await analytics.reports.batchGet({
      requestBody: {
        reportRequests: [{
          viewId: process.env.GOOGLE_ANALYTICS_VIEW_ID,
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          metrics: [
            { expression: 'ga:users' },
            { expression: 'ga:pageviews' },
            { expression: 'ga:avgSessionDuration' },
            { expression: 'ga:bounceRate' }
          ],
          dimensions: [{ name: 'ga:date' }]
        }]
      }
    });

    // 2. Récupérer les données géographiques
    const countriesData = await analytics.reports.batchGet({
      requestBody: {
        reportRequests: [{
          viewId: process.env.GOOGLE_ANALYTICS_VIEW_ID,
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          metrics: [{ expression: 'ga:users' }],
          dimensions: [{ name: 'ga:country' }],
          orderBys: [{ fieldName: 'ga:users', sortOrder: 'DESCENDING' }],
          pageSize: 10
        }]
      }
    });

    // 3. Récupérer les données d'appareils
    const devicesData = await analytics.reports.batchGet({
      requestBody: {
        reportRequests: [{
          viewId: process.env.GOOGLE_ANALYTICS_VIEW_ID,
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          metrics: [{ expression: 'ga:users' }],
          dimensions: [{ name: 'ga:deviceCategory' }]
        }]
      }
    });

    // 4. Récupérer les pages populaires
    const pagesData = await analytics.reports.batchGet({
      requestBody: {
        reportRequests: [{
          viewId: process.env.GOOGLE_ANALYTICS_VIEW_ID,
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          metrics: [{ expression: 'ga:pageviews' }],
          dimensions: [{ name: 'ga:pagePath' }],
          orderBys: [{ fieldName: 'ga:pageviews', sortOrder: 'DESCENDING' }],
          pageSize: 10
        }]
      }
    });

    // Traiter les données de base
    const basicRows = basicData.data.reports[0].data.rows || [];
    const today = new Date().toISOString().split('T')[0];
    const todayData = basicRows.find(row => row.dimensions[0] === today);

    // Traiter les données géographiques
    const countriesRows = countriesData.data.reports[0].data.rows || [];
    const totalUsers = countriesRows.reduce((sum, row) => sum + parseInt(row.metrics[0].values[0]), 0);
    const countries = countriesRows.slice(0, 4).map(row => ({
      name: row.dimensions[0],
      percentage: Math.round((parseInt(row.metrics[0].values[0]) / totalUsers) * 100)
    }));

    // Traiter les données d'appareils
    const devicesRows = devicesData.data.reports[0].data.rows || [];
    const totalDeviceUsers = devicesRows.reduce((sum, row) => sum + parseInt(row.metrics[0].values[0]), 0);
    const devices = devicesRows.map(row => ({
      name: row.dimensions[0],
      percentage: Math.round((parseInt(row.metrics[0].values[0]) / totalDeviceUsers) * 100)
    }));

    // Traiter les pages populaires
    const pagesRows = pagesData.data.reports[0].data.rows || [];
    const topPages = pagesRows.slice(0, 5).map(row => ({
      name: row.dimensions[0].replace('/', '').replace('-', ' ') || 'Page d\'accueil',
      views: parseInt(row.metrics[0].values[0])
    }));

    // Données finales avec vraies données GA4
    const analyticsData = {
      // Statistiques générales (vraies données)
      visitorsToday: todayData ? parseInt(todayData.metrics[0].values[0]) : 0,
      pageViewsToday: todayData ? parseInt(todayData.metrics[1].values[0]) : 0,
      avgTimeOnSite: todayData ? Math.round(parseInt(todayData.metrics[2].values[0]) / 60) + 'm' : '0m',
      bounceRate: todayData ? Math.round(parseFloat(todayData.metrics[3].values[0]) * 100) + '%' : '0%',
      
      // Évolution 7 jours (vraies données)
      last7Days: basicRows.map(row => ({
        date: row.dimensions[0],
        visitors: parseInt(row.metrics[0].values[0]),
        pageViews: parseInt(row.metrics[1].values[0])
      })),
      
      // Pages populaires (vraies données)
      topPages: topPages,
      
      // Géographie (vraies données)
      countries: countries,
      
      // Appareils (vraies données)
      devices: devices,
      
      // Temps réel (données factices - trop complexe pour l'instant)
      realTime: {
        activeUsers: 0,
        currentHourViews: 0
      }
    };

    return res.status(200).json(analyticsData);
  } catch (error) {
    console.error('Analytics API error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
