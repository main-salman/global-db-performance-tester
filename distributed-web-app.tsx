import { useState, useEffect } from 'react';
import axios from 'axios';

interface FileData {
  id: number;
  file_name: string;
  file_size: number;
  file_type: string;
  region: string;
  created_at: string;
  upload_duration_ms: number;
}

interface DatabaseStatus {
  region: string;
  endpoint: string;
  status: string;
  files: FileData[];
  error?: string;
}

export default function DistributedWebApp() {
  const [selectedRegion, setSelectedRegion] = useState<string>('us-west-1');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadTime, setUploadTime] = useState<number>(0);
  const [databaseStatuses, setDatabaseStatuses] = useState<DatabaseStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchDatabaseStatuses();
    // Refresh every 5 seconds
    const interval = setInterval(fetchDatabaseStatuses, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('region', selectedRegion);

    try {
      setIsUploading(true);
      setUploadProgress('Uploading...');
      const startTime = Date.now();

      await axios.post('/api/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
          setUploadProgress(`Uploading: ${percentCompleted}%`);
        }
      });
      
      const endTime = Date.now();
      setUploadTime(endTime - startTime);
      const fileSizeMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
      setUploadProgress(`Upload complete! File (${fileSizeMB}MB) uploaded to ${selectedRegion}`);
      
      // Refresh database statuses
      fetchDatabaseStatuses();
    } catch (error) {
      setUploadProgress('Upload failed');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (fileId: number) => {
    try {
      const response = await axios.get(`/api/download/${fileId}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', response.headers['content-disposition']?.split('filename=')[1] || 'download');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const fetchDatabaseStatuses = async () => {
    try {
      const response = await axios.get('/api/databases');
      console.log('Database statuses:', response.data);
      // Log the first file from each database to verify upload_duration_ms
      response.data.forEach((db: DatabaseStatus) => {
        if (db.files.length > 0) {
          console.log(`${db.region} first file:`, {
            name: db.files[0].file_name,
            duration: db.files[0].upload_duration_ms
          });
        }
      });
      setDatabaseStatuses(response.data);
    } catch (error) {
      console.error('Error fetching database statuses:', error);
    }
  };

  return (
    <div className="p-4 bg-yellow-200">
      <h1 className="text-2xl font-bold mb-4">Database Performance Testing</h1>
      
      <div className="mb-4">
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="input-apple mr-4"
        >
          <option value="us-west-1">US West</option>
          <option value="sa-east-1">South America</option>
          <option value="ap-southeast-2">Asia Pacific</option>
        </select>
        
        <input
          type="file"
          onChange={handleFileSelect}
          className="file-input-apple mr-4"
        />
        
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="button-apple disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {(uploadProgress || uploadTime > 0) && (
        <div className="mb-4 p-4 bg-purple-50 rounded border border-purple-100">
          {uploadProgress && (
            <p className="text-purple-700 font-medium">{uploadProgress}</p>
          )}
          {uploadTime > 0 && (
            <p className="text-purple-600 mt-1 space-x-4">
              <span>
                Duration: <span className="font-medium">{uploadTime} milliseconds</span>
              </span>
              <span>
                Speed: <span className="font-medium">
                  {((selectedFile?.size || 0) / 1024 / 1024 / (uploadTime / 1000)).toFixed(2)} MB/s
                </span>
              </span>
            </p>
          )}
        </div>
      )}

      <div className="space-y-4">
        {databaseStatuses.map((db) => (
          <div
            key={db.region}
            className="border border-purple-200 p-4 rounded shadow-sm"
          >
            <h2 className="text-xl font-bold mb-2">
              {db.region}
              <span 
                className={`ml-2 px-2 py-1 text-sm rounded ${
                  db.status === 'connected' ? 'bg-purple-200 text-purple-700' : 'bg-red-200'
                }`}
              >
                {db.status}
              </span>
            </h2>
            <p className="text-sm text-purple-600 mb-2">{db.endpoint}</p>
            {db.error && (
              <p className="text-red-500 text-sm mb-2">{db.error}</p>
            )}
            <div className="space-y-2 divide-y divide-purple-100">
              <div className="overflow-x-auto">
                <table className="min-w-full table-apple">
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Size</th>
                      <th>Type</th>
                      <th>Upload Duration</th>
                      <th>Upload Speed</th>
                      <th>Upload Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {db.files.map((file) => (
                      <tr key={file.id}>
                        <td className="font-medium">{file.file_name}</td>
                        <td>{(file.file_size / 1024 / 1024).toFixed(2)} MB</td>
                        <td>{file.file_type}</td>
                        <td>
                          <span className="duration-badge">
                            {file.upload_duration_ms} ms
                          </span>
                        </td>
                        <td>
                          {((file.file_size / 1024 / 1024) / (file.upload_duration_ms / 1000)).toFixed(2)} MB/s
                        </td>
                        <td>{new Date(file.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 