# Database Performance Lab

A web application to test and measure database transaction speeds across different global regions. The application allows users to upload files to different regional databases and measure the upload duration and performance metrics.

## Components

### Frontend
- Next.js React application with TypeScript
- Tailwind CSS for styling with Apple-inspired design
- Real-time performance metrics display
- Interactive region selection
- File upload progress tracking

### Backend
- Next.js API routes
- PostgreSQL databases in multiple regions
- AWS RDS instances for database hosting
- File handling with formidable
- Performance metrics collection

### Infrastructure
- Terraform configurations for AWS resources
- Multi-region RDS deployments
- Network security groups
- VPC configurations

## Prerequisites

- Node.js (v16 or later)
- npm or yarn
- AWS Account with appropriate permissions
- Terraform (v1.0 or later)
- PostgreSQL client (optional, for direct database access)

## Installation

### 1. Install Terraform

**macOS (using Homebrew):**

```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
```

**Windows (using Chocolatey):**

```bash
choco install terraform
```

**Linux (Ubuntu/Debian):**

```bash
sudo apt-get update && sudo apt-get install -y gnupg software-properties-common curl
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install terraform
```

### 2. Clone and Setup Application

```bash
git clone https://github.com/yourusername/database-performance-lab.git
cd database-performance-lab
npm install
```

### 3. Configure AWS Credentials

Create or modify `~/.aws/credentials` (Linux/macOS) or `%UserProfile%\.aws\credentials` (Windows):

```ini
[default]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY
```

### 4. Deploy Infrastructure

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### 5. Configure Environment Variables

Create a `.env.local` file in the project root:

```ini
DATABASE_URL_US_EAST="postgresql://user:password@us-east-instance:5432/dbname"
DATABASE_URL_EU_WEST="postgresql://user:password@eu-west-instance:5432/dbname"
DATABASE_URL_AP_SOUTH="postgresql://user:password@ap-south-instance:5432/dbname"
```

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Mode

```bash
npm run build
npm start
```

## Testing

Run the test suite:

```bash
npm test
```

## Monitoring

Access the AWS RDS console to monitor database metrics:
- CPU Utilization
- Database Connections
- Free Storage Space
- Read/Write IOPS

## Cleanup

To destroy the infrastructure:

```bash
cd terraform
terraform destroy
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.