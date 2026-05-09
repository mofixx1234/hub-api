/**
 * Instance Sequelize partagée par l'application (hors CLI).
 */
require('dotenv').config();
const { Sequelize } = require('sequelize');

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL manquant. Local : fichier .env. Vercel : Project → Settings → Environment Variables.'
  );
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  },
});

module.exports = sequelize;
