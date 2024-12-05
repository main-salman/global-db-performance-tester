import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id, region } = req.query;

  if (!id || !region || Array.isArray(id) || Array.isArray(region)) {
    return res.status(400).json({ message: 'Invalid parameters' });
  }

  const pool = new Pool({
    host: process.env[`DB_HOST_${region.replace(/-/g, '_').toUpperCase()}`],
    database: 'distributed_app',
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    port: 5432,
  });

  try {
    const result = await pool.query(
      'SELECT file_name, file_data, file_type FROM uploaded_files WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }

    const file = result.rows[0];
    
    res.setHeader('Content-Type', file.file_type);
    res.setHeader('Content-Disposition', `attachment; filename=${file.file_name}`);
    res.send(file.file_data);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Error downloading file' });
  }
} 