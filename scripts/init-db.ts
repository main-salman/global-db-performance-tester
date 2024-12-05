import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const regions = ['us-west-1', 'sa-east-1', 'ap-southeast-2'];
const dbConfig = {
  database: 'distributed_app',
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  port: 5432,
};

async function initializeDatabase() {
  for (const region of regions) {
    const pool = new Pool({
      ...dbConfig,
      host: process.env[`DB_HOST_${region.replace(/-/g, '_').toUpperCase()}`],
    });

    try {
      const migrationSQL = fs.readFileSync(
        path.join(__dirname, '../migrations/001_create_files_table.sql'),
        'utf8'
      );
      
      await pool.query(migrationSQL);
      console.log(`Database initialized in ${region}`);
    } catch (error) {
      console.error(`Error initializing database in ${region}:`, error);
    } finally {
      await pool.end();
    }
  }
}

initializeDatabase(); 