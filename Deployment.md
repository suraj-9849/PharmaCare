# pharmacare Backend Deployment Guide

## Prerequisites

Before deploying, ensure you have:

1. AWS Account with appropriate permissions
2. AWS CLI configured with credentials
3. Docker installed
4. ECR Repository created in AWS (ap-southeast-2 region)
5. Account ID: 301691475000

## Architecture

The deployment creates:
- ECS Fargate cluster with single task (256 CPU, 512MB RAM)
- Application Load Balancer for traffic distribution
- CloudWatch Logs for monitoring
- Uses external Neon PostgreSQL database
- No Redis/Cache dependencies

## Deployment Steps

### Step 1: Build Docker Image

Navigate to the backend directory:

cd /home/suraj/Documents/data/pharmacare/ph_backend

Build the Docker image:

docker build -t backend .

### Step 2: Authenticate Docker with ECR

Get login password and authenticate:

aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 301691475000.dkr.ecr.ap-southeast-2.amazonaws.com

### Step 3: Tag Docker Image

Tag the image for ECR:

docker tag backend:latest 301691475000.dkr.ecr.ap-southeast-2.amazonaws.com/backend:latest

### Step 4: Push to ECR

Push the image to ECR repository:

docker push 301691475000.dkr.ecr.ap-southeast-2.amazonaws.com/backend:latest

### Step 5: Deploy CloudFormation Stack

Navigate to project root:

cd /home/suraj/Documents/data/pharmacare

Create the CloudFormation stack:

aws cloudformation create-stack \
  --stack-name pharmacare-minimal \
  --template-body file://cloudformation-minimal.yaml \
  --region ap-southeast-2 \
  --capabilities CAPABILITY_IAM \
  --parameters ParameterKey=ImageUri,ParameterValue=301691475000.dkr.ecr.ap-southeast-2.amazonaws.com/backend:latest

### Step 6: Monitor Stack Creation

Check stack status:

aws cloudformation describe-stacks \
  --stack-name pharmacare-minimal \
  --region ap-southeast-2 \
  --query 'Stacks[0].StackStatus' \
  --output text

Wait for status to show: CREATE_COMPLETE

Monitor detailed events:

aws cloudformation describe-stack-events \
  --stack-name pharmacare-minimal \
  --region ap-southeast-2 \
  --query 'StackEvents[0:10]' \
  --output table

### Step 7: Get Backend URL

Retrieve the Load Balancer URL:

aws cloudformation describe-stacks \
  --stack-name pharmacare-minimal \
  --region ap-southeast-2 \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' \
  --output text

### Step 8: Test Backend

Test health endpoint:

curl http://<LOAD_BALANCER_URL>/health

Expected response:

{
  "status": "healthy",
  "timestamp": "2025-12-17T18:23:03.221Z",
  "services": {
    "database": "connected"
  }
}

Test root endpoint:

curl http://<LOAD_BALANCER_URL>/

## Updating the Stack

After making code changes, rebuild and redeploy:

### 1. Rebuild Docker Image

cd /home/suraj/Documents/data/pharmacare/ph_backend
docker build -t backend .

### 2. Tag and Push

docker tag backend:latest 301691475000.dkr.ecr.ap-southeast-2.amazonaws.com/backend:latest
docker push 301691475000.dkr.ecr.ap-southeast-2.amazonaws.com/backend:latest

### 3. Update CloudFormation Stack

cd /home/suraj/Documents/data/pharmacare

aws cloudformation update-stack \
  --stack-name pharmacare-minimal \
  --template-body file://cloudformation-minimal.yaml \
  --region ap-southeast-2 \
  --capabilities CAPABILITY_IAM \
  --parameters ParameterKey=ImageUri,ParameterValue=301691475000.dkr.ecr.ap-southeast-2.amazonaws.com/backend:latest

Monitor update progress:

aws cloudformation describe-stacks \
  --stack-name pharmacare-minimal \
  --region ap-southeast-2 \
  --query 'Stacks[0].StackStatus' \
  --output text

Wait for: UPDATE_COMPLETE

## Monitoring and Logs

### View Container Logs

Get log group name:

aws cloudformation describe-stacks \
  --stack-name pharmacare-minimal \
  --region ap-southeast-2 \
  --query 'Stacks[0].Outputs[?OutputKey==`ECSTaskLogGroup`].OutputValue' \
  --output text

Tail logs in real-time:

aws logs tail /ecs/pharmacare-backend --region ap-southeast-2 --follow

### View Recent Logs

Get last 50 log events:

aws logs tail /ecs/pharmacare-backend --region ap-southeast-2 --max-items 50

### Get Stack Outputs

View all stack outputs:

aws cloudformation describe-stacks \
  --stack-name pharmacare-minimal \
  --region ap-southeast-2 \
  --query 'Stacks[0].Outputs' \
  --output table

## Deleting the Stack

To delete the entire infrastructure:

aws cloudformation delete-stack \
  --stack-name pharmacare-minimal \
  --region ap-southeast-2

Monitor deletion:

aws cloudformation describe-stacks \
  --stack-name pharmacare-minimal \
  --region ap-southeast-2 \
  --query 'Stacks[0].StackStatus' \
  --output text

Wait for: DELETE_COMPLETE (or stack not found)

### Stack creation fails

Check CloudFormation events:

aws cloudformation describe-stack-events \
  --stack-name pharmacare-minimal \
  --region ap-southeast-2 \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]' \
  --output table

## Cost Information

This deployment uses AWS Free Tier resources:

- ECS Fargate: 750 hours/month free
- Load Balancer: Pay per LB-hour (not free)
- CloudWatch Logs: 5GB/month free

Total estimated cost: Minimal (primarily ALB charges)

## Additional Resources

- CloudFormation Template: cloudformation-minimal.yaml
- Backend Code: ph_backend/
- Frontend Code: ph_frontend/

## Quick Reference Commands

Create stack:
aws cloudformation create-stack --stack-name pharmacare-minimal --template-body file://cloudformation-minimal.yaml --region ap-southeast-2 --capabilities CAPABILITY_IAM --parameters ParameterKey=ImageUri,ParameterValue=301691475000.dkr.ecr.ap-southeast-2.amazonaws.com/backend:latest

Update stack:
aws cloudformation update-stack --stack-name pharmacare-minimal --template-body file://cloudformation-minimal.yaml --region ap-southeast-2 --capabilities CAPABILITY_IAM --parameters ParameterKey=ImageUri,ParameterValue=301691475000.dkr.ecr.ap-southeast-2.amazonaws.com/backend:latest

Get URL:
aws cloudformation describe-stacks --stack-name pharmacare-minimal --region ap-southeast-2 --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' --output text

View logs:
aws logs tail /ecs/pharmacare-backend --region ap-southeast-2 --follow

Delete stack:
aws cloudformation delete-stack --stack-name pharmacare-minimal --region ap-southeast-2


for i in {1..30}; do 
  STATUS=$(aws cloudformation describe-stacks --stack-name pharmacare-minimal --region ap-southeast-2 --query 'Stacks[0].StackStatus' --output text 2>/dev/null)
  TIME=$(date +'%H:%M:%S')
  echo "[$TIME] Status: $STATUS"
  if [[ "$STATUS" == "UPDATE_COMPLETE" ]]; then
    echo ""
    echo "STACK UPDATE COMPLETE!"
    echo ""
    sleep 30
    echo "Testing backend..."
    curl -s http://pharmacare-alb-809690050.ap-southeast-2.elb.amazonaws.com/health | jq .
    break
  elif [[ "$STATUS" == *"FAILED"* ]]; then
    echo " UPDATE FAILED!"
    break
  fi
  sleep 15
done