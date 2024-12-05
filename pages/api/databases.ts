import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

const getDbConfig = (region: string) => {
  let hostString: string;
  
  switch (region) {
    case 'us-west-1':
      hostString = process.env.DB_HOST_US_WEST || '';
      break;
    case 'sa-east-1':
      hostString = process.env.DB_HOST_SA_EAST || '';
      break;
    case 'ap-southeast-2':
      hostString = process.env.DB_HOST_AP_SOUTHEAST || '';
      break;
    default:
      throw new Error(`Invalid region: ${region}`);
  }

  if (!hostString) {
    throw new Error(`No database host found for region: ${region}`);
  }

  // Split host and port
  const [host, port] = hostString.split(':');

  return {
    host,
    port: parseInt(port || '5432'),
    database: 'distributed_app',
    user: process.env.DB_USERNAME || 'dbadmin',
    password: process.env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000
  };
};

const pools = {
  'us-west-1': new Pool(getDbConfig('us-west-1')),
  'sa-east-1': new Pool(getDbConfig('sa-east-1')),
  'ap-southeast-2': new Pool(getDbConfig('ap-southeast-2'))
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
    `SELECT 
      id, 
      file_name, 
      file_size, 
      file_type, 
      region, 
      created_at, 
      upload_duration_ms
     FROM uploaded_files 
     WHERE region = $1 
     ORDER BY created_at DESC`,
    [region]
  );
  
  if (result.rows.length > 0) {
    console.log('Sample file data:', {
      region,
      fileName: result.rows[0].file_name,
      size: result.rows[0].file_size,
      duration: result.rows[0].upload_duration_ms,
      speed: ((result.rows[0].file_size / (1024 * 1024)) / (result.rows[0].upload_duration_ms / 1000)).toFixed(2)
    });
  }
  
  return result;
};

const testConnection = async (pool: Pool, region: string) => {
  const config = getDbConfig(region);
  try {
    console.log(`Testing connection to ${region}...`, {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user
    });
    
    await pool.query('SELECT 1');
    console.log(`Connection to ${region} successful`);
    return true;
  } catch (error) {
    console.error(`Connection to ${region} failed:`, {
      error,
      config: {
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user
      },
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
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