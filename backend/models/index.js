const { sequelize } = require('../config/database');
const User = require('./User');
const Student = require('./Student');
const Vendor = require('./Vendor');
const Admin = require('./Admin');
const VerificationLog = require('./VerificationLog');
const ApiAccessLog = require('./ApiAccessLog');

// Define associations
// User to child relationships (hasOne - with aliases)
User.hasOne(Student, { foreignKey: 'user_id', as: 'student' });
User.hasOne(Vendor, { foreignKey: 'user_id', as: 'vendor' });
User.hasOne(Admin, { foreignKey: 'user_id', as: 'admin' });

// Child to User relationships (belongsTo - without aliases to avoid conflicts)
Student.belongsTo(User, { foreignKey: 'user_id' });
Vendor.belongsTo(User, { foreignKey: 'user_id' });
Admin.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Student to VerificationLog relationships
Student.hasMany(VerificationLog, { foreignKey: 'student_id', as: 'verificationLogs' });
VerificationLog.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

// Vendor to ApiAccessLog relationships
Vendor.hasMany(ApiAccessLog, { foreignKey: 'vendor_id', as: 'apiAccessLogs' });
ApiAccessLog.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });

// Admin can approve students (optional relationship)
Admin.hasMany(Student, { foreignKey: 'verified_by', as: 'verifiedStudents' });

module.exports = {
  sequelize,
  User,
  Student,
  Vendor,
  Admin,
  VerificationLog,
  ApiAccessLog
};
