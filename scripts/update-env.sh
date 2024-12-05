#!/bin/bash

# Get the endpoints from Terraform
US_WEST=$(terraform output -json public_endpoints | jq -r '.us_west')
SA_EAST=$(terraform output -json public_endpoints | jq -r '.sa_east')
AP_SOUTHEAST=$(terraform output -json public_endpoints | jq -r '.ap_southeast')

# Update .env.local
cat > .env.local << EOL
DB_HOST_US_WEST=$US_WEST
DB_HOST_SA_EAST=$SA_EAST
DB_HOST_AP_SOUTHEAST=$AP_SOUTHEAST
DB_USERNAME=dbadmin
DB_PASSWORD=YourStrongPasswordHere123!
EOL

echo "Updated .env.local with RDS endpoints" 