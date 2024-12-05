import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { fileName, region, uploadDurationMs } = req.body;

  // Log the received data
  console.log('Received update request:', { fileName, region, uploadDurationMs });

  // Get the appropriate database host based on the region
  const getDbHost = () => {
    switch (region) {
      case 'us-west-1':
        return process.env.DB_HOST_US_WEST?.split(':')[0];
      case 'sa-east-1':
        return process.env.DB_HOST_SA_EAST?.split(':')[0];
      case 'ap-southeast-2':
        return process.env.DB_HOST_AP_SOUTHEAST?.split(':')[0];
      default:
        throw new Error(`Invalid region: ${region}`);
    }
  };

  try {
    const host = getDbHost();
    console.log('Connecting to database at:', host);

    if (!host) {
      throw new Error(`No database host found for region: ${region}`);
    }

    const pool = new Pool({
      host,
      port: 5432,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: 'postgres',
      ssl: {
        rejectUnauthorized: false
      }
    });

    console.log('Executing update query...');
    const result = await pool.query(
      'UPDATE files SET upload_duration_ms = $1 WHERE file_name = $2 AND region = $3 RETURNING *',
      [uploadDurationMs, fileName, region]
    );

    console.log('Query result:', result.rowCount, 'rows affected');

    await pool.end();

    if (result.rowCount === 0) {
      return res.status(404).json({ 
        message: 'No matching file found to update',
        details: { fileName, region }
      });
    }

    res.status(200).json({ 
      message: 'Upload duration updated successfully',
      updatedFile: result.rows[0]
    });
  } catch (error) {
    console.error('Detailed error in update-upload-duration:', {
      error,
      stack: error.stack,
      fileName,
      region,
      uploadDurationMs,
      dbHost: getDbHost(),
      envVars: {
        DB_HOST_US_WEST: process.env.DB_HOST_US_WEST,
        DB_HOST_SA_EAST: process.env.DB_HOST_SA_EAST,
        DB_HOST_AP_SOUTHEAST: process.env.DB_HOST_AP_SOUTHEAST,
      }
    });

    res.status(500).json({ 
      message: 'Error updating upload duration',
      error: error.message
    });
  }
} 