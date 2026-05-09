/**
 * Statistiques & analytics — RBAC strict.
 */
const express = require('express');
const { exigerAuthentification } = require('../middleware/auth.middleware');
const { exigerTypes } = require('../middleware/role.middleware');
const stats = require('../controllers/stats.controller');

const router = express.Router();

router.get(
  '/admin',
  exigerAuthentification,
  exigerTypes('admin_central'),
  stats.adminDashboard
);
router.get(
  '/admin/revenue',
  exigerAuthentification,
  exigerTypes('admin_central'),
  stats.adminRevenue
);
router.get(
  '/admin/utilisateurs',
  exigerAuthentification,
  exigerTypes('admin_central'),
  stats.adminUtilisateurs
);
router.get(
  '/admin/abonnements',
  exigerAuthentification,
  exigerTypes('admin_central'),
  stats.adminAbonnements
);
router.get(
  '/admin/apps',
  exigerAuthentification,
  exigerTypes('admin_central'),
  stats.adminApps
);

router.get(
  '/ecole',
  exigerAuthentification,
  exigerTypes('admin_ecole'),
  stats.ecoleDashboard
);

router.get('/perso', exigerAuthentification, stats.perso);
router.post('/perso/log-export', exigerAuthentification, stats.logExport);

module.exports = router;
