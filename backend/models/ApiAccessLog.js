const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ApiAccessLog = sequelize.define('ApiAccessLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  vendor_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'vendors',
      key: 'id'
    }
  },
  endpoint: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  method: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  query_params: {
    type: DataTypes.JSON,
    allowNull: true
  },
  response_status: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  student_id_queried: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  ghana_card_queried: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'api_access_logs',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = ApiAccessLog;

