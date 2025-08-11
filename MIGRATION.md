# Migration Guide: Miru Web v1.9.0 → v2.0.0

This guide helps you migrate from Miru Web v1.9.0 to the new v2.0.0 release, which includes major dependency updates and architectural improvements.

## 🎯 Overview

Miru Web v2.0.0 is a major release that modernizes the entire technology stack while maintaining backward compatibility for all user-facing features. The main changes include:

- **React 18.3.1** with concurrent features
- **TypeScript 5.9.2** with enhanced type safety  
- **Vite build system** replacing Webpack
- **Rails 8.0.2** with Ruby 3.4.5
- **Modern toast notifications** with react-hot-toast
- **Enhanced development workflow** with improved tooling

## 🔄 Prerequisites

### System Requirements

| Dependency | v1.9.0 | v2.0.0 | Notes |
|------------|---------|---------|--------|
| Node.js | 18+ | 22 LTS | **Required upgrade** |
| Ruby | 3.4.0+ | 3.4.5+ | **Required upgrade** |
| PostgreSQL | 14+ | 14+ | No change |
| Docker | 20+ | 24+ | Recommended |

### Development Tools
```bash
# Required updates
nvm install 22
rbenv install 3.4.5

# Recommended tools
pnpm install -g pnpm@9  # Package manager
docker update            # Container runtime
```

## 🚀 Migration Steps

### Step 1: Environment Update

#### 1.1 Update Node.js
```bash
# Using nvm (recommended)
nvm install 22
nvm use 22
nvm alias default 22

# Verify version
node --version  # Should show v22.x.x
```

#### 1.2 Update Ruby
```bash
# Using rbenv (recommended)
rbenv install 3.4.5
rbenv local 3.4.5

# Using rvm
rvm install 3.4.5
rvm use 3.4.5 --default

# Verify version
ruby --version  # Should show ruby 3.4.5
```

#### 1.3 Clean and Reinstall Dependencies
```bash
# Remove old dependencies
rm -rf node_modules package-lock.json yarn.lock
rm -rf .bundle vendor/bundle

# Install fresh dependencies
pnpm install
bundle install
```

### Step 2: Development Workflow Changes

#### 2.1 New Development Server
```bash
# OLD (v1.9.0) - Webpack/Shakapacker
bin/webpack-dev-server
# or
bin/shakapacker-dev-server

# NEW (v2.0.0) - Vite
bin/vite dev
```

#### 2.2 Updated Development Commands
```bash
# Start all services (recommended)
foreman start -f Procfile.dev

# Individual services
bin/rails server              # Rails API server (port 3000)
bin/vite dev                 # Vite development server (auto-port)
```

#### 2.3 New Build Process
```bash
# Development build
bin/vite build --mode development

# Production build  
bin/vite build --mode production

# Rails asset compilation (if needed)
bin/rails assets:precompile
```

### Step 3: Code Migration

#### 3.1 Toast Notifications
If you were using custom toast implementations, update to the new react-hot-toast system:

```typescript
// OLD - Legacy toast system
import { showSuccessToast, showErrorToast } from 'utils/toast'

// NEW - react-hot-toast (already configured)
import { Toastr } from 'StyledComponents/Toastr'

// Usage remains the same
Toastr.success("Operation completed successfully")
Toastr.error("An error occurred")
Toastr.warning("Warning message")
Toastr.info("Information message")
```

#### 3.2 React Component Props
Most React component prop issues have been automatically fixed, but if you have custom components:

```typescript
// OLD - Using defaultProps (deprecated)
const MyComponent = ({ title, isActive }) => {
  // component logic
}
MyComponent.defaultProps = {
  title: 'Default Title',
  isActive: false
}

// NEW - Default parameters (modern)
const MyComponent = ({ 
  title = 'Default Title', 
  isActive = false 
}) => {
  // component logic
}
```

#### 3.3 TypeScript Updates
Update your TypeScript configuration if you have custom overrides:

```json
// tsconfig.json updates
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx"
  }
}
```

### Step 4: Testing Updates

#### 4.1 Playwright Integration
If you want to use the new E2E testing framework:

```bash
# Install Playwright browsers
npx playwright install

# Run Playwright tests
npx playwright test

# Interactive mode
npx playwright test --ui
```

#### 4.2 Updated Test Commands
```bash
# Rails tests (unchanged)
bundle exec rspec

# JavaScript/TypeScript linting
pnpm lint

# Type checking
npx tsc --noEmit
```

### Step 5: Docker Migration

#### 5.1 Updated Dockerfile
The new Docker setup includes multi-stage builds:

```dockerfile
# Base image updated
FROM node:22-alpine as node
FROM ruby:3.4.5-alpine as ruby

# Updated build process with Vite
RUN npm install -g pnpm@9
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
```

#### 5.2 Docker Compose Updates
```yaml
# docker-compose.yml updates
services:
  web:
    build: .
    environment:
      - NODE_VERSION=22
      - RUBY_VERSION=3.4.5
    volumes:
      - ./:/app
    ports:
      - "3000:3000"
      - "3036:3036"  # Vite dev server
```

### Step 6: Production Deployment

#### 6.1 Environment Variables
Add or update these environment variables:

```bash
# New environment variables
NODE_ENV=production
VITE_API_URL=https://your-api-domain.com
VITE_APP_VERSION=2.0.0

# Updated versions
RUBY_VERSION=3.4.5
NODE_VERSION=22
```

#### 6.2 Asset Compilation
```bash
# Production asset compilation
NODE_ENV=production bin/vite build
RAILS_ENV=production bin/rails assets:precompile
```

#### 6.3 Database Migrations
```bash
# Run any pending migrations
RAILS_ENV=production bin/rails db:migrate

# Update search indexes if needed
RAILS_ENV=production bin/rails searchkick:reindex:all
```

## 🔍 Verification Steps

### Verify Development Environment
```bash
# Check versions
node --version    # Should be v22.x.x
ruby --version    # Should be ruby 3.4.5
pnpm --version    # Should be 9.x.x

# Check application starts
bin/rails server  # Should start without errors
bin/vite dev      # Should start Vite dev server

# Check tests pass
bundle exec rspec spec/models  # Quick test
pnpm lint                     # Should pass linting
```

### Verify Key Features
1. **Authentication**: Login/logout functionality
2. **Time Tracking**: Entry creation and editing
3. **Invoicing**: Invoice generation and management  
4. **Reporting**: Dashboard and reports loading
5. **Toast Notifications**: Success/error messages display correctly

## ❗ Troubleshooting

### Common Issues

#### Issue: "Module not found" errors
**Solution**: Clear caches and reinstall
```bash
rm -rf node_modules .cache tmp/cache
pnpm install
bin/rails tmp:clear
```

#### Issue: TypeScript compilation errors
**Solution**: Update TypeScript configuration
```bash
# Generate new tsconfig.json
npx tsc --init
# Then merge with existing configuration
```

#### Issue: Vite dev server not connecting
**Solution**: Check port conflicts
```bash
# Kill existing processes
lsof -ti:3036 | xargs kill
# Restart Vite
bin/vite dev
```

#### Issue: React hot reload not working
**Solution**: Clear browser cache and restart dev server
```bash
# Clear everything
rm -rf node_modules/.vite tmp/cache
bin/vite dev
```

### Performance Issues

#### Slow builds
```bash
# Enable Vite optimizations
export VITE_OPTIMIZE_DEPS=true
bin/vite dev
```

#### Memory issues during development
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max_old_space_size=8192"
bin/vite dev
```

## 📞 Support

### Getting Help
- **Documentation**: Check updated README.md
- **Issues**: Create GitHub issue with migration tag
- **Community**: Join development discussions

### Rollback Plan
If you need to rollback to v1.9.0:

```bash
# Switch back to previous version
git checkout v1.9.0-branch

# Reinstall old dependencies  
nvm use 18
rbenv use 3.4.0
rm -rf node_modules
npm install  # or yarn install
bundle install
```

## 🎉 What's Next

After successful migration, you can:

1. **Explore new features**: Enhanced toast notifications, improved performance
2. **Update development workflow**: Leverage faster Vite builds
3. **Contribute**: Help improve the platform with modern tooling
4. **Monitor performance**: Check application metrics for improvements

---

**Migration Questions?** Open an issue with the `migration-v2` label for assistance.

**Full Migration Checklist**: 
- [ ] Updated Node.js to v22
- [ ] Updated Ruby to v3.4.5  
- [ ] Cleared and reinstalled dependencies
- [ ] Updated development commands
- [ ] Verified application functionality
- [ ] Updated production deployment scripts
- [ ] Tested key user workflows
- [ ] Updated team documentation