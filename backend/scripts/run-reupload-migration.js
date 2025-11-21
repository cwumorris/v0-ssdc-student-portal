// Script to run the migration for adding reupload columns
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
    
    const columns = [
      { name: 'email_reupload_required', sql: 'ALTER TABLE students ADD COLUMN email_reupload_required BOOLEAN DEFAULT FALSE' },
      { name: 'phone_reupload_required', sql: 'ALTER TABLE students ADD COLUMN phone_reupload_required BOOLEAN DEFAULT FALSE' },
      { name: 'selfie_reupload_required', sql: 'ALTER TABLE students ADD COLUMN selfie_reupload_required BOOLEAN DEFAULT FALSE' },
      { name: 'id_document_reupload_required', sql: 'ALTER TABLE students ADD COLUMN id_document_reupload_required BOOLEAN DEFAULT FALSE' },
      { name: 'student_id_reupload_required', sql: 'ALTER TABLE students ADD COLUMN student_id_reupload_required BOOLEAN DEFAULT FALSE' },
      { name: 'university_reupload_required', sql: 'ALTER TABLE students ADD COLUMN university_reupload_required BOOLEAN DEFAULT FALSE' },
      { name: 'ghana_card_reupload_required', sql: 'ALTER TABLE students ADD COLUMN ghana_card_reupload_required BOOLEAN DEFAULT FALSE' },
      { name: 'full_name_reupload_required', sql: 'ALTER TABLE students ADD COLUMN full_name_reupload_required BOOLEAN DEFAULT FALSE' },
      { name: 'program_reupload_required', sql: 'ALTER TABLE students ADD COLUMN program_reupload_required BOOLEAN DEFAULT FALSE' },
      { name: 'level_reupload_required', sql: 'ALTER TABLE students ADD COLUMN level_reupload_required BOOLEAN DEFAULT FALSE' }
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

