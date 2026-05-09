/**
 * API école (admin rattaché).
 */
const express = require('express');
const { exigerAuthentification } = require('../middleware/auth.middleware');
const { exigerTypes } = require('../middleware/role.middleware');
const ecole = require('../controllers/ecole.controller');

const router = express.Router();

router.get(
  '/professeurs',
  exigerAuthentification,
  exigerTypes('admin_ecole'),
  ecole.listeProfesseurs
);

module.exports = router;
