# 🚀 Quick Start Guide

## 📋 Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose (optional)
- Git

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/parth3690/nationwide-toll-hub.git
cd nationwide-toll-hub
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set up Environment
```bash
cp env.example .env
# Edit .env with your configuration
```

### 4. Start Development Environment

#### Option A: Full Stack (Recommended)
```bash
# Start all services with Docker
docker-compose up -d

# Or start individual services
npm run dev
```

#### Option B: Individual Services
```bash
# Backend API Server
npm run dev:backend

# Web Application
npm run dev:web

# Mobile Application (React Native)
npm run dev:mobile
```

## 🌐 Access Applications

- **Web App**: http://localhost:3000
- **API Server**: http://localhost:3001
- **Mobile App**: Use React Native CLI or Expo

## 🧪 Running Tests

```bash
# All tests
npm test

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Performance tests
npm run test:performance
```

## 🚀 Production Deployment

### Docker Deployment
```bash
# Build and run with Docker
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment
```bash
# Build all applications
npm run build

# Start production servers
npm run start
```

## 📱 Mobile Development

### iOS
```bash
cd apps/mobile
npx react-native run-ios
```

### Android
```bash
cd apps/mobile
npx react-native run-android
```

## 🔧 Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in `.env` file
2. **Database connection**: Ensure PostgreSQL is running
3. **Mobile build issues**: Check React Native setup

### Getting Help

- Check the [README.md](README.md) for detailed documentation
- Review [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines
- Open an [issue](https://github.com/parth3690/nationwide-toll-hub/issues) for support

## 📊 Project Structure

```
nationwide-toll-hub/
├── apps/                    # Applications
│   ├── mobile/             # React Native mobile app
│   └── web/                 # Next.js web app
├── services/               # Backend services
│   ├── auth/               # Authentication service
│   ├── database/           # Database service
│   └── event-processor/    # Event processing service
├── packages/               # Shared packages
│   ├── shared/             # Shared utilities
│   └── connectors/          # Agency connectors
├── tests/                  # Test files
├── docs/                   # Documentation
├── infrastructure/         # Infrastructure configs
└── public/                 # Static files
```

## 🎯 Next Steps

1. **Explore the applications** in the `apps/` directory
2. **Review the backend services** in the `services/` directory
3. **Run the test suite** to verify everything works
4. **Check the documentation** in the `docs/` directory
5. **Deploy to production** using the deployment guides

**Happy coding! 🚀**
