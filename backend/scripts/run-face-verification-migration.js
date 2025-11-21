// Script to run the migration for adding face_verification_photo_url column
const { sequelize } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'add-face-verification-photo.sql'),
      'utf8'
    );

    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

    for (const statement of statements) {
      await sequelize.query(statement.trim(), {
        type: sequelize.QueryTypes.RAW
      });
      console.log('✓ Executed:', statement.trim().substring(0, 50) + '...');
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    if (error.message && error.message.includes('Duplicate column')) {
      console.log('⚠️  Column already exists. Migration skipped.');
      process.exit(0);
    } else {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    }
  }
}

runMigration();

