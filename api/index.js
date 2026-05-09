/**
 * Entrée Vercel (serverless) — même app Express que `src/server.js`, sans `listen` ni crons in-process.
 * En local : utiliser `npm run dev` / `npm start` (voir `src/server.js`).
 */
require('dotenv').config();
const { validerEnvironnement } = require('../src/config/validate-env');
validerEnvironnement();

const app = require('../src/app');
module.exports = app;
