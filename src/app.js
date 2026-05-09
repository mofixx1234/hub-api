/**
 * Application Express — webhook Wave (corps brut) avant express.json().
 */
require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const catalogueRoutes = require('./routes/catalogue.routes');
const monHubRoutes = require('./routes/mon_hub.routes');
const paiementsRoutes = require('./routes/paiements.routes');
const ecoleRoutes = require('./routes/ecole.routes');
const appsSportRoutes = require('./routes/apps.sport.routes');
const appsEpsCiRoutes = require('./routes/apps.eps.ci.routes');
const appsEpsJvRoutes = require('./routes/apps.eps.jv.routes');
const statsRoutes = require('./routes/stats.routes');
const profilRoutes = require('./routes/profil.routes');
const evalClasseRoutes = require('./routes/eval_classe.routes');
const evalBacCiRoutes = require('./routes/eval_bac_ci.routes');
const adminBaremesRoutes = require('./routes/admin_baremes.routes');
const publicRoutes = require('./routes/public.routes');
const appsEpsFrLibreRoutes = require('./routes/apps.eps.fr_libre.routes');
const { webhookWave } = require('./controllers/webhooks.wave.controller');
const { gestionnaireErreur, routeIntrouvable } = require('./middleware/erreur.middleware');
const { exigerAuthentification } = require('./middleware/auth.middleware');
const { verifierAbonnement } = require('./middleware/verifierAbonnement.middleware');
const { verifierAbonnementEvalClasse } = require('./middleware/eval-classe-abonnement.middleware');

const app = express();

const origines = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((s) => s.trim())
  : true;

app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: origines,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Wave-Signature'],
  })
);

app.get('/health', (req, res) => {
  res.json({ statut: 'ok', service: 'hub-api' });
});

/** Wave envoie du JSON brut — accepter tout Content-Type qualifié côté Wave. */
app.post(
  '/api/webhooks/wave',
  express.raw({ type: () => true, limit: '512kb' }),
  webhookWave
);

app.use(express.json({ limit: '1mb' }));

/** Routes publiques (sans jeton) — avant garde-fous auth sur les autres préfixes /api. */
app.use('/api/public', publicRoutes);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const limiteGlobal = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erreur: 'Trop de requêtes. Réessayez dans une minute.' },
});

const limiteConnexion = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erreur: 'Trop de tentatives de connexion depuis cette adresse.' },
});

app.use('/api', limiteGlobal);

app.use('/api/auth/connexion', limiteConnexion);
app.use('/api/auth/inscription', limiteConnexion);
app.use('/api/auth/mot-de-passe/demande', limiteConnexion);

app.use('/api/auth', authRoutes);
app.use('/api/catalogue', catalogueRoutes);
app.use('/api/mon-hub', monHubRoutes);
app.use('/api/paiements', paiementsRoutes);
app.use('/api/ecole', ecoleRoutes);
/** Apps métier : JWT + abonnement rubrique actif (barrière avant les routes Postman/curl). */
app.use(
  '/api/apps/sport',
  exigerAuthentification,
  verifierAbonnement('SPORT'),
  appsSportRoutes
);
app.use(
  '/api/apps/eps/ci',
  exigerAuthentification,
  verifierAbonnement('ENSEIGNEMENT_CI'),
  appsEpsCiRoutes
);
app.use(
  '/api/apps/eps/jules-verne',
  exigerAuthentification,
  verifierAbonnement('ENSEIGNEMENT_FR'),
  appsEpsJvRoutes
);
app.use('/api/stats', statsRoutes);
app.use('/api/profil', profilRoutes);
app.use(
  '/api/apps/eval-classe',
  exigerAuthentification,
  verifierAbonnementEvalClasse,
  evalClasseRoutes
);
app.use(
  '/api/apps/eval-bac-ci',
  exigerAuthentification,
  verifierAbonnement('ENSEIGNEMENT_CI'),
  evalBacCiRoutes
);
app.use(
  '/api/apps/eps/fr-libre',
  exigerAuthentification,
  verifierAbonnement('ENSEIGNEMENT_FR'),
  appsEpsFrLibreRoutes
);
app.use('/api/admin/baremes', adminBaremesRoutes);

app.use(routeIntrouvable);
app.use(gestionnaireErreur);

module.exports = app;
