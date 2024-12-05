const { execSync } = require('child_process');

// Get Terraform outputs
const getTerraformOutputs = () => {
  try {
    const outputs = JSON.parse(execSync('terraform output -json').toString());
    
    // Get the database endpoints from Terraform outputs
    const endpoints = outputs.public_endpoints.value;
    
    return {
      DB_HOST_US_WEST: endpoints.us_west,
      DB_HOST_SA_EAST: endpoints.sa_east,
      DB_HOST_AP_SOUTHEAST: endpoints.ap_southeast,
      DB_USERNAME: outputs.db_credentials.value.username,
      DB_PASSWORD: outputs.db_credentials.value.password,
    };
  } catch (error) {
    // In development, use environment variables or defaults
    if (process.env.NODE_ENV === 'development') {
      return {
        DB_HOST_US_WEST: process.env.DB_HOST_US_WEST,
        DB_HOST_SA_EAST: process.env.DB_HOST_SA_EAST,
        DB_HOST_AP_SOUTHEAST: process.env.DB_HOST_AP_SOUTHEAST,
        DB_USERNAME: process.env.DB_USERNAME || 'dbadmin',
        DB_PASSWORD: process.env.DB_PASSWORD || 'YourStrongPasswordHere123!',
      };
    }
    console.error('Failed to get Terraform outputs:', error);
    throw error;
  }
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: process.env.NODE_ENV === 'development' 
    ? {
        DB_HOST_US_WEST: process.env.DB_HOST_US_WEST,
        DB_HOST_SA_EAST: process.env.DB_HOST_SA_EAST,
        DB_HOST_AP_SOUTHEAST: process.env.DB_HOST_AP_SOUTHEAST,
        DB_USERNAME: process.env.DB_USERNAME || 'dbadmin',
        DB_PASSWORD: process.env.DB_PASSWORD || 'YourStrongPasswordHere123!',
      }
    : getTerraformOutputs(),
}

module.exports = nextConfig