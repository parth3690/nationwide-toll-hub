# 🚀 Deployment Guide

## 📋 Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)
- Git

## 🚀 Quick Deployment

### 1. Clone and Setup
```bash
git clone https://github.com/parth3690/nationwide-toll-hub.git
cd nationwide-toll-hub
npm run setup
```

### 2. Start with Docker (Recommended)
```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Access Applications
- **Web App**: http://localhost:3000
- **API Server**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## 🐳 Docker Deployment

### Development
```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

## ☸️ Kubernetes Deployment

### Prerequisites
- Kubernetes cluster
- kubectl configured
- Helm (optional)

### Deploy
```bash
# Apply Kubernetes manifests
kubectl apply -f infrastructure/k8s/

# Check deployment
kubectl get pods
kubectl get services
```

## 🔧 Manual Deployment

### 1. Backend Services
```bash
# Install dependencies
npm install

# Set up database
npm run db:migrate
npm run db:seed

# Start services
npm run dev:backend
```

### 2. Web Application
```bash
cd apps/web
npm install
npm run dev
```

### 3. Mobile Application
```bash
cd apps/mobile
npm install
npx react-native run-ios    # iOS
npx react-native run-android # Android
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Specific Tests
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Performance tests
npm run test:performance
```

## 📊 Monitoring

### Health Checks
```bash
# API health
curl http://localhost:3001/api/health

# Database health
npm run health
```

### Logs
```bash
# Docker logs
docker-compose logs -f

# Application logs
npm run logs
```

## 🔒 Security

### Environment Variables
- Copy `.env.example` to `.env`
- Update all secrets and API keys
- Use strong passwords for production

### SSL/TLS
- Configure SSL certificates
- Use HTTPS in production
- Enable security headers

## 📈 Performance

### Database Optimization
```bash
# Run migrations
npm run db:migrate

# Optimize database
npm run db:optimize
```

### Caching
- Redis is configured for caching
- Enable query caching
- Use CDN for static assets

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check port usage
   lsof -i :3000
   lsof -i :3001
   ```

2. **Database connection**
   ```bash
   # Check database status
   docker-compose ps postgres
   ```

3. **Memory issues**
   ```bash
   # Check memory usage
   docker stats
   ```

### Logs and Debugging
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs api-server
docker-compose logs web-app
```

## 🔄 Updates and Maintenance

### Update Application
```bash
git pull origin main
npm install
npm run build
docker-compose restart
```

### Database Migrations
```bash
npm run db:migrate
```

### Backup Database
```bash
docker-compose exec postgres pg_dump -U toll_hub_user toll_hub > backup.sql
```

## 📞 Support

- **Documentation**: [README.md](README.md)
- **Issues**: [GitHub Issues](https://github.com/parth3690/nationwide-toll-hub/issues)
- **Discussions**: [GitHub Discussions](https://github.com/parth3690/nationwide-toll-hub/discussions)

## 🎯 Production Checklist

- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database backups scheduled
- [ ] Monitoring configured
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] Log aggregation setup
- [ ] Health checks configured
- [ ] Auto-scaling configured
- [ ] CDN configured
