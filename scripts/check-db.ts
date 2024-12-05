import { Pool } from 'pg';

const regions = ['us-west-1', 'sa-east-1', 'ap-southeast-2'];

async function checkDatabases() {
  for (const region of regions) {
    const pool = new Pool({
      host: process.env[`DB_HOST_${region.replace(/-/g, '_').toUpperCase()}`],
      database: 'distributed_app',
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      port: 5432,
    });

    try {
      console.log(`\nChecking ${region}...`);
      
      // Check connection
      await pool.query('SELECT 1');
      console.log('✅ Database connection successful');

      // Check if table exists
      const tableResult = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'uploaded_files'
        );
      `);
      console.log('Table exists:', tableResult.rows[0].exists);

      // Show table structure
      if (tableResult.rows[0].exists) {
        const columns = await pool.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'uploaded_files';
        `);
        console.log('Table structure:', columns.rows);
      }

    } catch (error) {
      console.error(`❌ Error with ${region}:`, error);
    } finally {
      await pool.end();
    }
  }
}

checkDatabases(); 