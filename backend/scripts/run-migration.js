// Script to run the migration for adding verification columns
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true
    });

    console.log('✅ Connected to database');
    
    const migrationSQL = `
      ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS student_id_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS university_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS ghana_card_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS selfie_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS id_document_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS full_name_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS program_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS level_verified BOOLEAN DEFAULT FALSE;
    `;

    // MySQL doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
    // So we'll try to add each column individually and ignore errors if they exist
    const columns = [
      { name: 'student_id_verified', sql: 'ALTER TABLE students ADD COLUMN student_id_verified BOOLEAN DEFAULT FALSE' },
      { name: 'university_verified', sql: 'ALTER TABLE students ADD COLUMN university_verified BOOLEAN DEFAULT FALSE' },
      { name: 'ghana_card_verified', sql: 'ALTER TABLE students ADD COLUMN ghana_card_verified BOOLEAN DEFAULT FALSE' },
      { name: 'selfie_verified', sql: 'ALTER TABLE students ADD COLUMN selfie_verified BOOLEAN DEFAULT FALSE' },
      { name: 'id_document_verified', sql: 'ALTER TABLE students ADD COLUMN id_document_verified BOOLEAN DEFAULT FALSE' },
      { name: 'full_name_verified', sql: 'ALTER TABLE students ADD COLUMN full_name_verified BOOLEAN DEFAULT FALSE' },
      { name: 'program_verified', sql: 'ALTER TABLE students ADD COLUMN program_verified BOOLEAN DEFAULT FALSE' },
      { name: 'level_verified', sql: 'ALTER TABLE students ADD COLUMN level_verified BOOLEAN DEFAULT FALSE' }
    ];

    for (const column of columns) {
      try {
        await connection.execute(column.sql);
        console.log(`✅ Added column: ${column.name}`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`⚠️  Column ${column.name} already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }

    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
}

runMigration();

