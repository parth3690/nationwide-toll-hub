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
