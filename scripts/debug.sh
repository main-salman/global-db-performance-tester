#!/bin/bash

echo "Checking database setup..."
ts-node scripts/check-db.ts

echo -e "\nChecking ECS task status..."
aws ecs list-tasks \
  --cluster distributed-app-test \
  --region me-south-1

echo -e "\nChecking environment variables in container..."
TASK_ARN=$(aws ecs list-tasks --cluster distributed-app-test --region me-south-1 --query 'taskArns[0]' --output text)
aws ecs execute-command \
  --cluster distributed-app-test \
  --task $TASK_ARN \
  --container distributed-app-container \
  --command "env" \
  --region me-south-1

echo -e "\nWatching logs..."
aws logs tail "/ecs/distributed-app" \
  --region me-south-1 \
  --follow 