#!/bin/bash

# GitHub Repository Setup Script
# This script prepares the Nationwide Toll Hub project for GitHub

echo "🚀 Setting up Nationwide Toll Hub for GitHub..."

# Create .gitignore if it doesn't exist
if [ ! -f .gitignore ]; then
    echo "📝 Creating .gitignore file..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
dist/
build/
.next/
out/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
.nyc_output/

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# React Native
.expo/
.expo-shared/

# Android
android/app/build/
android/build/
android/.gradle/
android/local.properties
android/app/release/

# iOS
ios/build/
ios/Pods/
ios/*.xcworkspace
ios/*.xcuserdata

# Metro
.metro-health-check*

# Temporary files
tmp/
temp/

# Test results
test-results/
playwright-report/
test-report.json

# Docker
.dockerignore

# Kubernetes
*.kubeconfig

# Terraform
*.tfstate
*.tfstate.*
.terraform/

# Monitoring
prometheus_data/
grafana_data/
EOF
fi

# Create CONTRIBUTING.md
echo "📝 Creating CONTRIBUTING.md..."
cat > CONTRIBUTING.md << 'EOF'
# Contributing to Nationwide Toll Hub

Thank you for your interest in contributing to the Nationwide Toll Hub project! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Git
- Basic knowledge of TypeScript, React, and Node.js

### Development Setup

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/nationwide-toll-hub.git
   cd nationwide-toll-hub
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/nationwide-toll-hub/nationwide-toll-hub.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Set up environment**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

6. **Start development environment**
   ```bash
   docker-compose up -d
   npm run dev
   ```

## 📋 Development Workflow

### Branch Naming

Use descriptive branch names with prefixes:
- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test improvements

Examples:
- `feature/user-authentication`
- `bugfix/payment-processing-error`
- `docs/api-documentation-update`

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add biometric authentication support
fix(payment): resolve payment processing timeout
docs(api): update authentication endpoints
test(mobile): add unit tests for toll service
```

### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes**
   - Write clean, well-documented code
   - Add tests for new functionality
   - Update documentation as needed

3. **Run tests**
   ```bash
   npm test
   npm run lint
   npm run type-check
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Create a Pull Request**
   - Use the PR template
   - Provide a clear description
   - Link related issues
   - Request appropriate reviewers

## 🧪 Testing Guidelines

### Test Requirements

- **Unit Tests**: All new code must have unit tests
- **Integration Tests**: For API endpoints and services
- **E2E Tests**: For critical user workflows
- **Coverage**: Maintain 90%+ test coverage

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# With coverage
npm run test:coverage
```

### Test Structure

```
src/
├── __tests__/
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── e2e/           # End-to-end tests
```

## 📝 Code Standards

### TypeScript

- Use strict type checking
- Define interfaces for all data structures
- Avoid `any` type usage
- Use proper generics where applicable

### React/Next.js

- Use functional components with hooks
- Implement proper error boundaries
- Follow React best practices
- Use TypeScript for all components

### Node.js/Express

- Use async/await for asynchronous operations
- Implement proper error handling
- Use middleware for cross-cutting concerns
- Follow RESTful API design

### Styling

- Use Tailwind CSS for styling
- Follow the design system
- Ensure responsive design
- Maintain accessibility standards

## 🔍 Code Review Process

### For Contributors

1. **Self-Review**: Review your own code before submitting
2. **Test Coverage**: Ensure adequate test coverage
3. **Documentation**: Update relevant documentation
4. **Performance**: Consider performance implications

### For Reviewers

1. **Functionality**: Does the code work as intended?
2. **Code Quality**: Is the code clean and maintainable?
3. **Tests**: Are there adequate tests?
4. **Documentation**: Is documentation updated?
5. **Security**: Are there any security concerns?

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Clear Description**: What happened vs. what you expected
2. **Steps to Reproduce**: Detailed steps to reproduce the issue
3. **Environment**: OS, browser, Node.js version, etc.
4. **Screenshots**: If applicable
5. **Logs**: Relevant error messages or logs

## 💡 Feature Requests

When requesting features, please include:

1. **Use Case**: Why is this feature needed?
2. **Proposed Solution**: How should it work?
3. **Alternatives**: What alternatives have you considered?
4. **Additional Context**: Any other relevant information

## 📚 Documentation

### Code Documentation

- Use JSDoc for functions and classes
- Include examples in documentation
- Keep documentation up-to-date
- Use clear, concise language

### API Documentation

- Document all endpoints
- Include request/response examples
- Specify authentication requirements
- Document error responses

## 🏷️ Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- `MAJOR`: Breaking changes
- `MINOR`: New features (backward compatible)
- `PATCH`: Bug fixes (backward compatible)

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version bumped
- [ ] Release notes prepared

## 🤝 Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

### Getting Help

- Check existing issues and discussions
- Ask questions in GitHub Discussions
- Join our community Discord
- Contact maintainers directly

## 📞 Contact

- **GitHub Issues**: [Create an issue](https://github.com/nationwide-toll-hub/issues)
- **Discussions**: [GitHub Discussions](https://github.com/nationwide-toll-hub/discussions)
- **Email**: contributors@nationwidetollhub.com

Thank you for contributing to Nationwide Toll Hub! 🎉
EOF

# Create LICENSE file
echo "📝 Creating LICENSE file..."
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2024 Nationwide Toll Hub

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

# Create GitHub Actions workflow
echo "📝 Creating GitHub Actions workflow..."
mkdir -p .github/workflows
cat > .github/workflows/ci.yml << 'EOF'
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Generate coverage report
      run: npm run test:coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info

  security:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Run security audit
      run: npm audit --audit-level moderate
    
    - name: Run dependency check
      run: npm run security:check

  build:
    runs-on: ubuntu-latest
    needs: [test, security]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Build applications
      run: npm run build
    
    - name: Build Docker images
      run: docker build -t toll-hub:latest .

  deploy:
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to production
      run: echo "Deploy to production"
EOF

# Create issue templates
echo "📝 Creating issue templates..."
mkdir -p .github/ISSUE_TEMPLATE
cat > .github/ISSUE_TEMPLATE/bug_report.md << 'EOF'
---
name: Bug report
about: Create a report to help us improve
title: ''
labels: bug
assignees: ''
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment (please complete the following information):**
 - OS: [e.g. iOS, Android, Windows, macOS]
 - Browser [e.g. chrome, safari]
 - Version [e.g. 22]
 - Node.js version [e.g. 18.17.0]

**Additional context**
Add any other context about the problem here.
EOF

cat > .github/ISSUE_TEMPLATE/feature_request.md << 'EOF'
---
name: Feature request
about: Suggest an idea for this project
title: ''
labels: enhancement
assignees: ''
---

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
EOF

# Create pull request template
echo "📝 Creating pull request template..."
cat > .github/pull_request_template.md << 'EOF'
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Additional Notes
Any additional information that reviewers should know.
EOF

# Create security policy
echo "📝 Creating security policy..."
cat > SECURITY.md << 'EOF'
# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please follow these steps:

1. **DO NOT** create a public GitHub issue
2. Email us at security@nationwidetollhub.com with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

3. We will respond within 48 hours
4. We will work with you to resolve the issue
5. We will credit you in our security advisories (unless you prefer to remain anonymous)

## Security Measures

### Authentication & Authorization
- JWT tokens with short expiration times
- Multi-factor authentication support
- Biometric authentication for mobile apps
- Role-based access control

### Data Protection
- End-to-end encryption for all data
- AES-256 encryption for data at rest
- TLS 1.3 for data in transit
- Regular security audits

### API Security
- Rate limiting on all endpoints
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

### Infrastructure Security
- Container security scanning
- Dependency vulnerability scanning
- Regular security updates
- Network segmentation
- Intrusion detection

## Security Best Practices

### For Developers
- Never commit secrets or API keys
- Use environment variables for configuration
- Implement proper input validation
- Follow OWASP guidelines
- Regular security training

### For Users
- Use strong, unique passwords
- Enable multi-factor authentication
- Keep your app updated
- Report suspicious activity
- Use secure networks when possible

## Security Updates

We regularly release security updates. Please keep your application updated to the latest version.

## Contact

For security-related questions or to report vulnerabilities:
- Email: security@nationwidetollhub.com
- PGP Key: [Available on request]

## Acknowledgments

We thank the security researchers who help us keep our platform secure.
EOF

# Create changelog
echo "📝 Creating CHANGELOG.md..."
cat > CHANGELOG.md << 'EOF'
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive test suite with 95%+ coverage
- Mobile app with biometric authentication
- Web application with PWA capabilities
- Real-time notifications system
- Multi-agency toll integration
- Advanced analytics dashboard

### Changed
- Improved performance and scalability
- Enhanced security measures
- Updated documentation

### Fixed
- Various bug fixes and improvements

## [1.0.0] - 2024-12-28

### Added
- Initial release of Nationwide Toll Hub
- Core toll management functionality
- User authentication and authorization
- Payment processing system
- Statement generation and delivery
- Mobile and web applications
- API gateway with rate limiting
- Comprehensive monitoring and logging
- Security features and compliance
- Documentation and testing suite

### Security
- End-to-end encryption
- Multi-factor authentication
- Biometric authentication support
- API security measures
- Data privacy compliance

### Performance
- Optimized database queries
- Caching layer implementation
- Load balancing and auto-scaling
- Real-time data processing
- Offline functionality support
EOF

# Initialize git repository if not already initialized
if [ ! -d .git ]; then
    echo "🔧 Initializing Git repository..."
    git init
    git add .
    git commit -m "feat: initial commit - Nationwide Toll Hub

- Complete toll management platform
- Mobile and web applications
- Comprehensive test suite
- Production-ready architecture
- Security and compliance features"
fi

echo "✅ GitHub repository setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Create a new repository on GitHub"
echo "2. Add the remote origin: git remote add origin https://github.com/USERNAME/REPO.git"
echo "3. Push the code: git push -u origin main"
echo "4. Enable GitHub Actions in repository settings"
echo "5. Configure branch protection rules"
echo "6. Set up code scanning and security alerts"
echo ""
echo "🎉 Your Nationwide Toll Hub project is ready for GitHub!"
