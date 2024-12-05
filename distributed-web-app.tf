# Variable declarations
variable "aws_access_key" {
  description = "AWS access key"
  type        = string
}

variable "aws_secret_key" {
  description = "AWS secret key"
  type        = string
}

variable "app_name" {
  description = "Name of the application"
  type        = string
}

variable "environment" {
  description = "Environment (e.g., dev, test, prod)"
  type        = string
}

variable "container_image" {
  description = "Docker image for the container"
  type        = string
}

variable "container_cpu" {
  description = "CPU units for the container"
  type        = number
}

variable "container_memory" {
  description = "Memory for the container in MB"
  type        = number
}

variable "db_username" {
  description = "Database username"
  type        = string
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    postgresql = {
      source  = "cyrilgdn/postgresql"
      version = "~> 1.21.0"
    }
  }
}

# Provider configurations
provider "aws" {
  region = "me-south-1"
  alias  = "me_south_1"
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}

provider "aws" {
  region = "us-west-1"
  alias  = "us_west_1"
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}

provider "aws" {
  region = "sa-east-1"
  alias  = "sa_east_1"
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}

provider "aws" {
  region = "ap-southeast-2"
  alias  = "ap_southeast_2"
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}

# RDS instances in each region
resource "aws_db_instance" "postgres_us_west" {
  provider             = aws.us_west_1
  identifier          = "${var.app_name}-${var.environment}-us-west"
  engine              = "postgres"
  engine_version      = "15.7"
  instance_class      = var.db_instance_class
  allocated_storage   = var.db_allocated_storage
  db_name            = "distributed_app"
  username           = var.db_username
  password           = var.db_password
  publicly_accessible = true
  skip_final_snapshot = true
  
  apply_immediately    = true
  deletion_protection = false
  backup_retention_period = 0
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"
  parameter_group_name = aws_db_parameter_group.postgres_params_us_west.name
  vpc_security_group_ids = [aws_security_group.rds_sg_us_west.id]
  db_subnet_group_name   = aws_db_subnet_group.us_west.name
}

# Create a DB parameter group
resource "aws_db_parameter_group" "postgres_params_us_west" {
  provider = aws.us_west_1
  name     = "${var.app_name}-${var.environment}-postgres-params-us-west"
  family   = "postgres15"

  parameter {
    name  = "rds.force_ssl"
    value = "0"
  }
}

# Parameter groups for each region
resource "aws_db_parameter_group" "postgres_params_sa_east" {
  provider = aws.sa_east_1
  name     = "${var.app_name}-${var.environment}-postgres-params-sa-east"
  family   = "postgres15"

  parameter {
    name  = "rds.force_ssl"
    value = "0"
  }
}

resource "aws_db_parameter_group" "postgres_params_ap_southeast" {
  provider = aws.ap_southeast_2
  name     = "${var.app_name}-${var.environment}-postgres-params-ap-southeast"
  family   = "postgres15"

  parameter {
    name  = "rds.force_ssl"
    value = "0"
  }
}

# Update security group for RDS
resource "aws_security_group" "rds_sg_us_west" {
  provider    = aws.us_west_1
  name        = "${var.app_name}-${var.environment}-rds-us-west-sg"
  description = "Security group for RDS in US West"
  vpc_id      = module.vpc_us_west.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow PostgreSQL access"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "${var.app_name}-${var.environment}-rds-us-west-sg"
  }
}

# Similar configurations for sa_east and ap_southeast...
resource "aws_db_instance" "postgres_sa_east" {
  provider             = aws.sa_east_1
  identifier          = "${var.app_name}-${var.environment}-sa-east"
  engine              = "postgres"
  engine_version      = "15.7"
  instance_class      = var.db_instance_class
  allocated_storage   = var.db_allocated_storage
  db_name            = "distributed_app"
  username           = var.db_username
  password           = var.db_password
  publicly_accessible = true
  skip_final_snapshot = true
  
  apply_immediately    = true
  deletion_protection = false
  backup_retention_period = 0
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"
  parameter_group_name = aws_db_parameter_group.postgres_params_sa_east.name
  vpc_security_group_ids = [aws_security_group.rds_sg_sa_east.id]
  db_subnet_group_name   = aws_db_subnet_group.sa_east.name
}

resource "aws_db_instance" "postgres_ap_southeast" {
  provider             = aws.ap_southeast_2
  identifier          = "${var.app_name}-${var.environment}-ap-southeast"
  engine              = "postgres"
  engine_version      = "15.7"
  instance_class      = var.db_instance_class
  allocated_storage   = var.db_allocated_storage
  db_name            = "distributed_app"
  username           = var.db_username
  password           = var.db_password
  publicly_accessible = true
  skip_final_snapshot = true
  
  apply_immediately    = true
  deletion_protection = false
  backup_retention_period = 0
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"
  parameter_group_name = aws_db_parameter_group.postgres_params_ap_southeast.name
  vpc_security_group_ids = [aws_security_group.rds_sg_ap_southeast.id]
  db_subnet_group_name   = aws_db_subnet_group.ap_southeast.name
}

# Security Groups for RDS
resource "aws_security_group" "rds_sg_sa_east" {
  provider    = aws.sa_east_1
  name        = "${var.app_name}-${var.environment}-rds-sa-east-sg"
  description = "Security group for RDS in SA East"
  vpc_id      = module.vpc_sa_east.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "rds_sg_ap_southeast" {
  provider    = aws.ap_southeast_2
  name        = "${var.app_name}-${var.environment}-rds-ap-southeast-sg"
  description = "Security group for RDS in AP Southeast"
  vpc_id      = module.vpc_ap_southeast.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# DB Subnet Groups
resource "aws_db_subnet_group" "us_west" {
  provider   = aws.us_west_1
  name       = "${var.app_name}-${var.environment}-us-west-subnet-group"
  subnet_ids = module.vpc_us_west.public_subnets

  tags = {
    Name        = "${var.app_name}-us-west-subnet-group"
    Environment = var.environment
  }
}

resource "aws_db_subnet_group" "sa_east" {
  provider   = aws.sa_east_1
  name       = "${var.app_name}-${var.environment}-sa-east-subnet-group"
  subnet_ids = module.vpc_sa_east.public_subnets

  tags = {
    Name        = "${var.app_name}-sa-east-subnet-group"
    Environment = var.environment
  }
}

resource "aws_db_subnet_group" "ap_southeast" {
  provider   = aws.ap_southeast_2
  name       = "${var.app_name}-${var.environment}-ap-southeast-subnet-group"
  subnet_ids = module.vpc_ap_southeast.public_subnets

  tags = {
    Name        = "${var.app_name}-ap-southeast-subnet-group"
    Environment = var.environment
  }
}

# VPC modules for each region
module "vpc_us_west" {
  source = "terraform-aws-modules/vpc/aws"
  providers = {
    aws = aws.us_west_1
  }

  name = "${var.app_name}-${var.environment}-vpc-us-west"
  cidr = "172.16.0.0/16"

  azs             = ["us-west-1b", "us-west-1c"]
  private_subnets = ["172.16.1.0/24", "172.16.2.0/24"]
  public_subnets  = ["172.16.101.0/24", "172.16.102.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true

  tags = {
    Environment = var.environment
    Region      = "us-west-1"
  }
}

module "vpc_sa_east" {
  source = "terraform-aws-modules/vpc/aws"
  providers = {
    aws = aws.sa_east_1
  }

  name = "${var.app_name}-${var.environment}-vpc-sa-east"
  cidr = "172.17.0.0/16"

  azs             = ["sa-east-1a", "sa-east-1c"]
  private_subnets = ["172.17.1.0/24", "172.17.2.0/24"]
  public_subnets  = ["172.17.101.0/24", "172.17.102.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true

  tags = {
    Environment = var.environment
    Region      = "sa-east-1"
  }
}

module "vpc_ap_southeast" {
  source = "terraform-aws-modules/vpc/aws"
  providers = {
    aws = aws.ap_southeast_2
  }

  name = "${var.app_name}-${var.environment}-vpc-ap-southeast"
  cidr = "172.18.0.0/16"

  azs             = ["ap-southeast-2a", "ap-southeast-2b"]
  private_subnets = ["172.18.1.0/24", "172.18.2.0/24"]
  public_subnets  = ["172.18.101.0/24", "172.18.102.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true

  tags = {
    Environment = var.environment
    Region      = "ap-southeast-2"
  }
}

# Outputs for database endpoints
output "db_endpoints" {
  value = {
    us_west = aws_db_instance.postgres_us_west.endpoint
    sa_east = aws_db_instance.postgres_sa_east.endpoint
    ap_southeast = aws_db_instance.postgres_ap_southeast.endpoint
  }
}

# Output for database credentials
output "db_credentials" {
  value = {
    username = var.db_username
    password = var.db_password
  }
  sensitive = true
}

# Output public endpoints for easy access
output "public_endpoints" {
  value = {
    us_west = "${aws_db_instance.postgres_us_west.endpoint}:5432"
    sa_east = "${aws_db_instance.postgres_sa_east.endpoint}:5432"
    ap_southeast = "${aws_db_instance.postgres_ap_southeast.endpoint}:5432"
  }
}
