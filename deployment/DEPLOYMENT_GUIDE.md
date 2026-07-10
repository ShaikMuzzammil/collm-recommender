# CoLLM Deployment Guide

## Quick Start (5 minutes)

### Prerequisites
- Docker & Docker Compose installed
- Git installed
- 8GB+ RAM available

### Step 1: Clone and Deploy
```bash
git clone https://github.com/yourusername/collm-capstone.git
cd collm-capstone/deployment
docker-compose up -d
```

### Step 2: Verify Deployment
```bash
# Check services
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Test API
curl http://localhost:8000/health
```

### Step 3: Access Application
- **Web Interface**: http://localhost:3000
- **API Base**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Redoc**: http://localhost:8000/redoc

## Production Deployment

### AWS Deployment

#### 1. Create EC2 Instance
```bash
# Launch t3.large or better with Ubuntu 22.04
# Security Group: Allow ports 22, 80, 443, 8000
```

#### 2. Setup Server
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone and deploy
git clone https://github.com/yourusername/collm-capstone.git
cd collm-capstone/deployment
sudo docker-compose up -d
```

#### 3. Setup Nginx Reverse Proxy (Optional)
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/collm
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/collm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 4. Setup SSL with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Google Cloud Platform (GCP)

#### 1. Create Compute Engine Instance
```bash
gcloud compute instances create collm-server \
  --machine-type=n1-standard-4 \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=50GB \
  --tags=http-server,https-server
```

#### 2. Deploy with Cloud Build
```bash
# Create cloudbuild.yaml
gcloud builds submit --config cloudbuild.yaml
```

### Azure Deployment

#### 1. Create Virtual Machine
```bash
az vm create \
  --resource-group collm-rg \
  --name collm-vm \
  --image UbuntuLTS \
  --size Standard_D4s_v3 \
  --generate-ssh-keys
```

## Kubernetes Deployment

### 1. Create Namespace
```bash
kubectl create namespace collm
```

### 2. Deploy Backend
```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: collm-backend
  namespace: collm
spec:
  replicas: 3
  selector:
    matchLabels:
      app: collm-backend
  template:
    metadata:
      labels:
        app: collm-backend
    spec:
      containers:
      - name: backend
        image: your-registry/collm-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: REDIS_URL
          value: "redis://collm-redis:6379"
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
```

### 3. Deploy Frontend
```yaml
# frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: collm-frontend
  namespace: collm
spec:
  replicas: 2
  selector:
    matchLabels:
      app: collm-frontend
  template:
    metadata:
      labels:
        app: collm-frontend
    spec:
      containers:
      - name: frontend
        image: your-registry/collm-frontend:latest
        ports:
        - containerPort: 80
```

### 4. Deploy Services
```bash
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f services.yaml
kubectl apply -f ingress.yaml
```

## Monitoring

### Prometheus + Grafana
```yaml
# Add to docker-compose.yml
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### Key Metrics
- Request latency (p50, p95, p99)
- Recommendation accuracy (AUC)
- Cache hit rate
- GPU utilization
- Error rate

## Scaling

### Horizontal Scaling
```bash
# Scale backend to 5 instances
docker-compose up -d --scale backend=5

# Or with Kubernetes
kubectl scale deployment collm-backend --replicas=5
```

### Vertical Scaling
```bash
# Increase GPU memory
docker-compose up -d --scale backend=1
# Edit docker-compose.yml to increase GPU memory
```

## Backup and Recovery

### Database Backup
```bash
# Backup Redis
docker exec collm-redis redis-cli BGSAVE

# Backup model weights
docker cp collm-backend:/app/models ./backup/models
```

### Disaster Recovery
```bash
# Restore from backup
docker-compose down
docker-compose up -d --build
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find and kill process
sudo lsof -i :8000
sudo kill -9 <PID>

# Or use different port
docker-compose up -d -p 8001:8000
```

#### 2. Out of Memory
```bash
# Increase Docker memory limit
docker-compose up -d --memory=8g

# Or add swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### 3. GPU Not Available
```bash
# Check NVIDIA Docker runtime
sudo docker run --rm --gpus all nvidia/cuda:11.8-base nvidia-smi

# Install NVIDIA Container Toolkit if needed
```

### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail=100 backend
```

## Performance Optimization

### 1. Model Quantization
```python
# Apply INT8 quantization
import torch
model = torch.quantization.quantize_dynamic(
    model, {torch.nn.Linear}, dtype=torch.qint8
)
```

### 2. Batch Inference
```python
# Process multiple requests together
batch_size = 64
results = model.predict(batch_inputs)
```

### 3. Cache Warming
```bash
# Pre-compute popular user embeddings
python scripts/warm_cache.py --users=top-1000
```

## Security

### 1. API Authentication
```python
# Add to FastAPI
from fastapi.security import HTTPBearer

security = HTTPBearer()

@app.get("/recommend")
async def recommend(token: str = Depends(security)):
    # Validate token
    pass
```

### 2. Rate Limiting
```python
from slowapi import Limiter

limiter = Limiter(key_func=lambda: request.client.host)

@app.get("/recommend")
@limiter.limit("100/minute")
async def recommend(...):
    pass
```

### 3. HTTPS
```bash
# Use Let's Encrypt
certbot --nginx -d your-domain.com
```

## Maintenance

### Regular Tasks
- **Daily**: Check error logs, monitor metrics
- **Weekly**: Review performance, update dependencies
- **Monthly**: Retrain model with new data, security updates
- **Quarterly**: Architecture review, capacity planning

### Update Procedure
```bash
# Pull latest code
git pull origin main

# Rebuild and deploy
docker-compose down
docker-compose up -d --build

# Verify deployment
curl http://localhost:8000/health
```

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/collm-capstone/issues
- Email: support@collm.example.com
- Documentation: https://docs.collm.example.com
