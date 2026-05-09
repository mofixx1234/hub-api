/**
 * Configuration sequelize-cli (migrations). Charge DATABASE_URL depuis .env
 */
require('dotenv').config();

module.exports = {
  development: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: false,
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl:
        process.env.DATABASE_SSL === 'true'
          ? { require: true, rejectUnauthorized: false }
          : false,
    },
  },
};
