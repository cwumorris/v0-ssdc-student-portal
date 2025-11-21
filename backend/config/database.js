require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'ssdc_portal',
  process.env.DB_USER || 'vidhan',
  process.env.DB_PASSWORD || 'Covid@19',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 8889,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = { sequelize };

