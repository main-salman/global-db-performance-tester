import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

const pools = {
  'us-west-1': new Pool({
    host: process.env.DB_HOST_US_WEST?.split(':')[0],
    port: parseInt(process.env.DB_HOST_US_WEST?.split(':')[1] || '5432'),
    database: 'distributed_app',
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 30000,
    query_timeout: 30000,
    statement_timeout: 30000,
    idle_in_transaction_session_timeout: 30000
  }),
  'sa-east-1': new Pool({
    host: process.env.DB_HOST_SA_EAST?.split(':')[0],
    port: parseInt(process.env.DB_HOST_SA_EAST?.split(':')[1] || '5432'),
    database: 'distributed_app',
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 30000,
    query_timeout: 30000,
    statement_timeout: 30000,
    idle_in_transaction_session_timeout: 30000
  }),
  'ap-southeast-2': new Pool({
    host: process.env.DB_HOST_AP_SOUTHEAST?.split(':')[0],
    port: parseInt(process.env.DB_HOST_AP_SOUTHEAST?.split(':')[1] || '5432'),
    database: 'distributed_app',
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 30000,
    query_timeout: 30000,
    statement_timeout: 30000,
    idle_in_transaction_session_timeout: 30000
  })
};

const createTablesIfNotExist = async (pool: Pool) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS uploaded_files (
        id SERIAL PRIMARY KEY,
        file_name VARCHAR(255) NOT NULL,
        file_data BYTEA NOT NULL,
        file_size BIGINT NOT NULL,
        file_type VARCHAR(100),
        region VARCHAR(50) NOT NULL,
        upload_duration_ms INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name='uploaded_files' AND column_name='upload_duration_ms'
        ) THEN
          ALTER TABLE uploaded_files ADD COLUMN upload_duration_ms INTEGER;
        END IF;
      END $$;
    `);

  } catch (error) {
    console.error('Error creating table:', error);
    throw error;
  }
};

const fetchDatabaseFiles = async (pool: Pool, region: string) => {
  console.log(`Fetching files for region ${region}...`);
  const result = await pool.query(
    `SELECT id, file_name, file_size, file_type, region, created_at, 
      COALESCE(upload_duration_ms, 0) as upload_duration_ms 
     FROM uploaded_files 
     WHERE region = $1 
     ORDER BY created_at DESC`,
    [region]
  );
  console.log(`Found ${result.rows.length} files, first file:`, result.rows[0]);
  return result;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Environment variables:', {
    DB_HOST_US_WEST: process.env.DB_HOST_US_WEST,
    DB_HOST_SA_EAST: process.env.DB_HOST_SA_EAST,
    DB_HOST_AP_SOUTHEAST: process.env.DB_HOST_AP_SOUTHEAST,
    DB_USERNAME: '[REDACTED]',
    DB_PASSWORD: '[REDACTED]'
  });

  // First ensure tables exist in all databases
  await Promise.all(
    Object.entries(pools).map(async ([region, pool]) => {
      try {
        await createTablesIfNotExist(pool);
      } catch (error) {
        console.error(`Failed to create tables in ${region}:`, error);
      }
    })
  );

  const databaseStatuses = await Promise.all(
    Object.entries(pools).map(async ([region, pool]) => {
      try {
        // Test connection with shorter timeout
        await pool.query('SELECT 1');
        
        // Now fetch files with optimized query
        const result = await fetchDatabaseFiles(pool, region);

        return {
          region,
          endpoint: process.env[`DB_HOST_${region.replace(/-/g, '_').toUpperCase()}`],
          status: 'connected',
          files: result.rows
        };
      } catch (error) {
        console.error(`Database error for ${region}:`, error);
        return {
          region,
          endpoint: process.env[`DB_HOST_${region.replace(/-/g, '_').toUpperCase()}`],
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          files: []
        };
      }
    })
  );

  res.status(200).json(databaseStatuses);
} 