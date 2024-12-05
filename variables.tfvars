# AWS Authentication
aws_access_key = "lkjlkj"    # Replace with your actual access key
aws_secret_key = "lkjlkj"  # Replace with your actual secret key

# Application configuration
app_name    = "distributed-app"
environment = "test"

# Database configuration
db_username          = "dbadmin"
db_password          = "YourStrongPasswordHere123!"
db_instance_class    = "db.t3.micro"
db_allocated_storage = 20

# Container configuration
container_image   = "" #if you deploy from ECR, replace with the image URI
container_cpu     = 256  # 0.25 vCPU
container_memory  = 512  # 512 MB

# Network configuration
vpc_cidr = "10.0.0.0/16"