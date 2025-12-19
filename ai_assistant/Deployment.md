## 1. Build Docker Image
```sh
cd ai_assistant
# Build the Docker image
docker build -t pharmacare-ai:latest .
```

## 2. Create ECR Repository (if not exists)
```sh
aws ecr create-repository --repository-name pharmacare-ai --region ap-southeast-2
```

## 3. Authenticate Docker to ECR
```sh
aws ecr get-login-password --region ap-southeast-2 | \
  docker login --username AWS --password-stdin 301691475000.dkr.ecr.ap-southeast-2.amazonaws.com
```

## 4. Tag and Push Image to ECR
```sh
docker tag pharmacare-ai:latest 301691475000.dkr.ecr.ap-southeast-2.amazonaws.com/pharmacare-ai:latest
docker push 301691475000.dkr.ecr.ap-southeast-2.amazonaws.com/pharmacare-ai:latest
```

## 5. Deploy CloudFormation Stack
```sh
aws cloudformation create-stack \
  --stack-name pharmacare-ai-stack \
  --template-body file://cloudformation.yaml \
  --capabilities CAPABILITY_IAM \
  --region ap-southeast-2 \
  --parameters \
    ParameterKey=ImageUri,ParameterValue=301691475000.dkr.ecr.ap-southeast-2.amazonaws.com/pharmacare-ai:latest \
    ParameterKey=DatabaseUrl,ParameterValue='postgresql://neondb_owner:npg_TimAG9BU4twO@ep-shiny-recipe-a4p9axzv-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require' \
    ParameterKey=OpenRouterApiKey,ParameterValue='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'
```

## 6. Update Stack (for new image or config)
```sh
aws cloudformation update-stack \
  --stack-name pharmacare-ai-stack \
  --template-body file://cloudformation.yaml \
  --capabilities CAPABILITY_IAM \
  --region ap-southeast-2 \
  --parameters \
    ParameterKey=ImageUri,ParameterValue=301691475000.dkr.ecr.ap-southeast-2.amazonaws.com/pharmacare-ai:latest \
    ParameterKey=DatabaseUrl,ParameterValue='postgresql://neondb_owner:npg_TimAG9BU4twO@ep-shiny-recipe-a4p9axzv-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require' \
    ParameterKey=OpenRouterApiKey,ParameterValue='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'
```

## 7. Force ECS Service Redeploy (after image update)
```sh
aws ecs update-service \
  --cluster pharmacare-ai-cluster \
  --service pharmacare-ai-service \
  --force-new-deployment \
  --region ap-southeast-2
```

## 8. Check Service Health
```sh
# Get Load Balancer DNS
aws elbv2 describe-load-balancers --region ap-southeast-2 --query "LoadBalancers[?contains(LoadBalancerName, 'pharmacare-ai')].DNSName" --output text

# Test health endpoint
curl http://<LOAD_BALANCER_DNS>/health
```

## 9. Direct Deploy to ECS (without CloudFormation)

You can run the container directly on ECS Fargate (one-off) using the following command:

```sh
aws ecs run-task \
  --cluster pharmacare-ai-cluster \
  --launch-type FARGATE \
  --network-configuration 'awsvpcConfiguration={subnets=[<SUBNET_ID_1>,<SUBNET_ID_2>],securityGroups=[<SECURITY_GROUP_ID>],assignPublicIp=ENABLED}' \
  --task-definition pharmacare-ai-task \
  --overrides '{
    "containerOverrides": [{
      "name": "pharmacare-ai-container",
      "environment": [
        {"name": "DATABASE_URL", "value": "postgresql://neondb_owner:npg_TimAG9BU4twO@ep-shiny-recipe-a4p9axzv-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"},
        {"name": "OPENROUTER_API_KEY", "value": "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"}
      ]
    }]
  }' \
  --region ap-southeast-2
```