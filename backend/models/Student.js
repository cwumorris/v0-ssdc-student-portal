const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  full_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  ghana_card_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  student_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  university: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  program: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  level: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  selfie_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  id_document_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  face_verification_photo_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  verification_status: {
    type: DataTypes.ENUM('pending', 'verified', 'rejected', 'under_review'),
    defaultValue: 'pending'
  },
  face_match_score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  verification_method: {
    type: DataTypes.ENUM('automated', 'manual', 'hybrid'),
    allowNull: true
  },
  verified_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'admins',
      key: 'id'
    }
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  phone_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  student_id_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  university_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ghana_card_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  selfie_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  id_document_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  full_name_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  program_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  level_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  face_verification_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  email_reupload_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  phone_reupload_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  selfie_reupload_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  id_document_reupload_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  student_id_reupload_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  university_reupload_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ghana_card_reupload_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  full_name_reupload_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  program_reupload_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  level_reupload_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verification_code: {
    type: DataTypes.STRING(6),
    allowNull: true
  },
  verification_code_expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'students',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Student;

