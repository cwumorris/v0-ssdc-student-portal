const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vendor = sequelize.define('Vendor', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  business_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  business_email: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  business_phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  business_registration_number: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  business_address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  business_certificate_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  business_license_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  api_key: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: true
  },
  api_key_created_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  api_calls_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  api_calls_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 1000
  },
  approval_status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'suspended'),
    defaultValue: 'pending'
  },
  approved_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'admins',
      key: 'id'
    }
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'vendors',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Vendor;

