import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { Pool } from 'pg';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
    maxDuration: 300,
  },
};

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
    connectionTimeoutMillis: 20000,
    statement_timeout: 30000,
    query_timeout: 30000,
    idle_in_transaction_session_timeout: 30000
  };
};

const pools = {
  'us-west-1': new Pool(getDbConfig('us-west-1')),
  'sa-east-1': new Pool(getDbConfig('sa-east-1')),
  'ap-southeast-2': new Pool(getDbConfig('ap-southeast-2'))
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== Start API Request ===');
  
  // Verify environment variables
  const requiredEnvVars = [
    'DB_HOST_US_WEST',
    'DB_HOST_SA_EAST',
    'DB_HOST_AP_SOUTHEAST',
    'DB_USERNAME',
    'DB_PASSWORD'
  ];

  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingEnvVars.length > 0) {
    console.error('Missing environment variables:', missingEnvVars);
    return res.status(500).json({
      message: 'Server configuration error',
      error: `Missing environment variables: ${missingEnvVars.join(', ')}`
    });
  }

  // Log configuration (redact sensitive info)
  console.log('Configuration:', {
    DB_HOST_US_WEST: process.env.DB_HOST_US_WEST,
    DB_HOST_SA_EAST: process.env.DB_HOST_SA_EAST,
    DB_HOST_AP_SOUTHEAST: process.env.DB_HOST_AP_SOUTHEAST,
    DB_USERNAME: '[REDACTED]',
    DB_PASSWORD: '[REDACTED]',
    METHOD: req.method,
    HEADERS: req.headers,
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let tempFilePath: string | undefined;

  try {
    const form = formidable({
      maxFileSize: 100 * 1024 * 1024,
    });

    // Get the request start time from headers
    const uploadStartTime = parseInt(req.headers['x-upload-start-time'] as string);
    if (!uploadStartTime) {
      return res.status(400).json({ message: 'Missing upload start time' });
    }

    console.log('Parsing form data...');
    const [fields, files] = await form.parse(req);
    
    console.log('Form data parsed:', {
      fields: JSON.stringify(fields),
      fileCount: files.file?.length || 0
    });

    if (!files.file?.[0]) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = files.file[0];
    tempFilePath = file.filepath;
    const region = fields.region?.[0];

    if (!region) {
      return res.status(400).json({ message: 'No region specified' });
    }

    console.log('File details:', {
      name: file.originalFilename,
      size: file.size,
      type: file.mimetype,
      region: region,
      tempPath: tempFilePath
    });

    const pool = pools[region as keyof typeof pools];
    if (!pool) {
      return res.status(400).json({ message: 'Invalid region' });
    }

    try {
      console.log(`Connecting to database in ${region}...`);
      const client = await pool.connect();
      
      try {
        console.log('Testing connection...');
        await client.query('SELECT NOW()');
        console.log('Connection successful');

        console.log('Creating table if not exists...');
        await client.query(`
          CREATE TABLE IF NOT EXISTS uploaded_files (
            id SERIAL PRIMARY KEY,
            file_name VARCHAR(255) NOT NULL,
            file_data BYTEA NOT NULL,
            file_size BIGINT NOT NULL,
            file_type VARCHAR(100),
            region VARCHAR(50) NOT NULL,
            upload_duration_ms INTEGER NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);

        console.log('Reading file...');
        const fileData = await fs.promises.readFile(file.filepath);
        console.log(`File read successfully (${fileData.length} bytes)`);

        // Calculate total duration after all operations are complete
        const totalDuration = Date.now() - uploadStartTime;
        console.log('Duration details:', {
          uploadStartTime,
          currentTime: Date.now(),
          totalDuration,
          fileSize: file.size,
          speedMBps: (file.size / (1024 * 1024)) / (totalDuration / 1000)
        });

        console.log('Inserting file with duration:', {
          fileName: file.originalFilename,
          size: file.size,
          duration: totalDuration
        });

        console.log('Storing file in database...');
        const result = await client.query(
          `INSERT INTO uploaded_files (file_name, file_data, file_size, file_type, region, upload_duration_ms)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *;`,  // Changed to RETURNING * to get all columns
          [
            file.originalFilename || 'unnamed',
            fileData,
            file.size,
            file.mimetype || 'application/octet-stream',
            region,
            totalDuration
          ]
        );

        const insertedFile = result.rows[0];
        console.log('File stored successfully:', {
          id: insertedFile.id,
          fileName: insertedFile.file_name,
          duration: insertedFile.upload_duration_ms
        });
        
        return res.status(200).json({
          success: true,
          message: 'File uploaded successfully',
          fileId: insertedFile.id,
          region: region,
          duration: totalDuration,
          details: {
            fileName: insertedFile.file_name,
            fileSize: insertedFile.file_size,
            uploadDuration: insertedFile.upload_duration_ms
          }
        });
      } finally {
        client.release();
      }
    } catch (dbError) {
      console.error('Database error:', {
        error: dbError,
        message: dbError instanceof Error ? dbError.message : 'Unknown error',
        stack: dbError instanceof Error ? dbError.stack : undefined
      });
      
      return res.status(500).json({
        message: 'Database error',
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
        details: JSON.stringify(dbError, null, 2)
      });
    }
  } catch (error) {
    console.error('Upload error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return res.status(500).json({
      message: 'Upload failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  } finally {
    if (tempFilePath) {
      try {
        await fs.promises.unlink(tempFilePath);
        console.log('Temporary file cleaned up:', tempFilePath);
      } catch (cleanupError) {
        console.error('Error cleaning up temporary file:', {
          path: tempFilePath,
          error: cleanupError
        });
      }
    }
    console.log('=== End API Request ===\n');
  }
} 