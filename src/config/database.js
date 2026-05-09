/**
 * Instance Sequelize partagée par l'application (hors CLI).
 * `pg` en import explicite : le bundler Vercel omet sinon le module (require dynamique dans Sequelize).
 */
require('dotenv').config();
const pg = require('pg');
const { Sequelize } = require('sequelize');

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL manquant. Local : fichier .env. Vercel : Project → Settings → Environment Variables.'
  );
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectModule: pg,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  },
});

module.exports = sequelize;
