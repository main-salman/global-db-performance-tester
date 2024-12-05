# Database Performance Lab

A web application to test and measure database transaction speeds across different global regions. The application allows users to upload files to different regional databases and measure the upload duration and performance metrics.

<img width="1037" alt="image" src="https://github.com/user-attachments/assets/bef0852d-aa8f-458e-8c55-e60f01594ff4">

## Components

### Infrastructure
- Terraform configurations for AWS resources
- Multi-region RDS deployments
- Network security groups
- VPC configurations

## Prerequisites

- Node.js (v16 or later)
- AWS Account with appropriate permissions
- Terraform (v1.0 or later)


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
git clone https://github.com/main-salman/global-db-performance-tester.git
cd global-db-performance-tester
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

Update the Variables.tfvar file with your AWS Access Key ID and Secret Access Key. You can leave the other variables as is - those are for features not implemented yet.

Also, install Terraform - this will work on Windows, Linux and Mac.

```bash
terraform init 
terraform plan -var-file="variables.tfvars" -auto-approve
terraform apply -var-file="variables.tfvars" -auto-approve
```


## Running the Application

```bash
npm run dev
```

In your browser, go to http://localhost:3000/ - and have fun using the application!

## Cleanup

To destroy the infrastructure:

```bash
terraform destroy -var-file="variables.tfvars" -auto-approve
```


## License

This project is licensed under the MIT License - see the LICENSE file for details.
