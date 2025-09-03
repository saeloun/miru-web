---
id: devcontainers
title: Dev Containers Setup
---

# Development with Dev Containers

Dev Containers provide a consistent, reproducible development environment using Docker. This approach ensures all contributors work in an identical environment, eliminating "works on my machine" issues.

## What are Dev Containers?

Dev Containers (Development Containers) are a way to use Docker containers as full-featured development environments. They provide:

- **Consistent Environment**: Same setup across all team members
- **Quick Onboarding**: New contributors can start coding in minutes
- **Isolated Dependencies**: No conflicts with your local system
- **Pre-configured Tools**: All necessary tools and extensions included
- **Cross-platform**: Works identically on Windows, macOS, and Linux

## Prerequisites

### Required Software
- **Docker Desktop**: [Download here](https://www.docker.com/products/docker-desktop/)
- **Visual Studio Code**: [Download here](https://code.visualstudio.com/)
- **Dev Containers Extension**: Install from VS Code marketplace

### System Requirements
- **Memory**: At least 8GB RAM (16GB recommended)
- **Storage**: 10GB free space for containers and images
- **CPU**: Modern multi-core processor

## Quick Start

### 1. Install Prerequisites

#### Install Docker Desktop
```bash
# macOS (using Homebrew)
brew install --cask docker

# Or download from https://www.docker.com/products/docker-desktop/

# Verify installation
docker --version
docker-compose --version
```

#### Install VS Code and Dev Containers Extension
```bash
# macOS (using Homebrew)
brew install --cask visual-studio-code

# Or download from https://code.visualstudio.com/

# Install Dev Containers extension
code --install-extension ms-vscode-remote.remote-containers
```

### 2. Clone and Open Repository

```bash
# Clone the repository
git clone https://github.com/saeloun/miru-web.git
cd miru-web

# Open in VS Code
code .
```

### 3. Open in Dev Container

1. VS Code should show a notification: "Folder contains a Dev Container configuration file"
2. Click **"Reopen in Container"**
3. Or use Command Palette (Cmd/Ctrl+Shift+P): "Dev Containers: Reopen in Container"

VS Code will:
- Build the development container
- Install all dependencies (Ruby, Node, PostgreSQL, etc.)
- Configure the development environment
- Open the project ready for development

## Dev Container Configuration

Miru's Dev Container includes:

### Base Environment
- **Ubuntu 22.04** as the base OS
- **Ruby 3.4.5** with rbenv
- **Node.js 22.11.0** with nvm
- **PostgreSQL 16** database server
- **Git** with common configurations

### Development Tools
- **Ruby LSP** for intelligent Ruby support
- **Solargraph** for Ruby IntelliSense
- **ESLint** and **Prettier** for JavaScript/TypeScript
- **Rubocop** for Ruby linting
- **bundler** and **pnpm** for dependency management

### VS Code Extensions (Auto-installed)
```json
{
  "extensions": [
    "castwide.solargraph",
    "rebornix.ruby",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

## Development Workflow

### Starting Development

Once the container is running:

```bash
# Install dependencies (automatically done on container build)
bundle install
pnpm install

# Setup database
bin/rails db:create db:migrate db:seed

# Start the development server
foreman start -f Procfile.dev
```

The application will be available at:
- **Main app**: [http://localhost:3000](http://localhost:3000)
- **Vite dev server**: [http://localhost:3036](http://localhost:3036)

### Running Tests

```bash
# Run all tests
bundle exec rspec

# Run specific test file
bundle exec rspec spec/models/user_spec.rb

# Run tests with coverage
COVERAGE=true bundle exec rspec

# Run system tests
bundle exec rspec spec/system/
```

### Database Management

```bash
# Access Rails console
bin/rails console

# Access database console
bin/rails dbconsole

# Reset database
bin/rails db:drop db:create db:migrate db:seed

# Check database status
bin/rails db:version
```

### Code Quality

```bash
# Ruby linting
bundle exec rubocop

# Auto-fix Ruby issues
bundle exec rubocop -a

# JavaScript/TypeScript linting
pnpm lint

# Format code
pnpm format
```

## Customization

### Personal Settings

You can customize your Dev Container experience:

#### Custom Dotfiles
```bash
# The container will automatically clone and setup your dotfiles
# if you have a dotfiles repository on GitHub
# Set in VS Code settings: "dotfiles.repository": "username/dotfiles"
```

#### Additional Extensions
Create `.vscode/extensions.json`:
```json
{
  "recommendations": [
    "your.preferred-extension",
    "another.extension"
  ]
}
```

#### Environment Variables
Create `.devcontainer/devcontainer.env`:
```bash
# Development-specific environment variables
DEBUG=true
LOG_LEVEL=debug
DISABLE_SPRING=true
```

### Port Forwarding

The Dev Container automatically forwards these ports:
- **3000**: Rails server
- **3036**: Vite dev server
- **5432**: PostgreSQL database

Access forwarded ports in VS Code's **Ports** panel.

## Troubleshooting

### Common Issues

#### Container Build Fails
```bash
# Clear Docker cache and rebuild
docker system prune -f
docker volume prune -f

# In VS Code: "Dev Containers: Rebuild Container"
```

#### Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Or rebuild container with correct permissions
# Add to devcontainer.json:
"remoteUser": "vscode",
"updateRemoteUserUID": true
```

#### Slow Performance
```bash
# Increase Docker memory allocation
# Docker Desktop > Settings > Resources > Memory: 8GB+

# Enable file sharing optimization
# Docker Desktop > Settings > General > "Use file sharing implementation"
```

#### Database Connection Issues
```bash
# Check PostgreSQL service
sudo service postgresql status

# Restart PostgreSQL
sudo service postgresql restart

# Check connection
psql -h localhost -U postgres -d miru_development
```

#### Port Already in Use
```bash
# Kill process using port 3000
sudo lsof -ti:3000 | xargs kill -9

# Or change port in development
bin/rails server -p 3001
```

### Performance Optimization

#### Speed Up Bundle Install
```bash
# Configure bundler for parallel jobs
bundle config set --local jobs $(nproc)

# Use local bundle path
bundle config set --local path 'vendor/bundle'
```

#### Optimize Node Modules
```bash
# Use pnpm for faster installs
corepack enable pnpm
pnpm install

# Clear npm cache
pnpm store prune
```

#### Database Optimization
```bash
# Add to postgresql.conf for development
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 256MB
```

## Advanced Configuration

### Custom Dev Container

To modify the Dev Container configuration, edit `.devcontainer/devcontainer.json`:

```json
{
  "name": "Miru Development",
  "dockerComposeFile": "docker-compose.yml",
  "service": "app",
  "workspaceFolder": "/workspace",
  "features": {
    "ghcr.io/devcontainers/features/github-cli:1": {},
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },
  "customizations": {
    "vscode": {
      "settings": {
        "terminal.integrated.defaultProfile.linux": "zsh",
        "ruby.intellisense": "rubyLSP"
      }
    }
  },
  "forwardPorts": [3000, 3035, 5432],
  "postCreateCommand": "bin/setup",
  "remoteUser": "vscode"
}
```

### Multi-Service Setup

For complex setups with multiple services:

```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: .devcontainer/Dockerfile
    volumes:
      - .:/workspace:cached
      - bundle-cache:/usr/local/bundle
    environment:
      - DATABASE_URL=postgresql://postgres@db:5432/miru_development
    depends_on:
      - db
      - redis
    ports:
      - "3000:3000"
      - "3035:3035"

  db:
    image: postgres:16
    environment:
      POSTGRES_HOST_AUTH_METHOD: trust
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres-data:
  bundle-cache:
```

## Team Collaboration

### Shared Configuration

The Dev Container configuration is committed to the repository, ensuring:
- **Consistent Environment**: Everyone uses the same setup
- **Easy Onboarding**: New team members start immediately
- **Version Control**: Environment changes are tracked
- **Cross-platform**: Works on any OS with Docker

### Best Practices

1. **Keep Configuration Simple**: Minimize custom modifications
2. **Document Changes**: Update this guide when modifying containers
3. **Test Thoroughly**: Ensure containers work on all platforms
4. **Version Lock**: Pin specific versions of tools and dependencies
5. **Security**: Don't include secrets in container configuration

## Comparison with Local Setup

| Aspect | Local Setup | Dev Containers |
|--------|-------------|----------------|
| **Setup Time** | 30-60 minutes | 5-10 minutes |
| **Consistency** | Varies by system | Identical for all |
| **Isolation** | Affects local system | Completely isolated |
| **Dependencies** | Manual installation | Automatic |
| **Updates** | Manual process | Rebuild container |
| **Cleanup** | Complex | Delete container |
| **Cross-platform** | Platform-specific | Universal |

## Migration from Local Setup

If you're currently using a local development setup:

### 1. Backup Your Work
```bash
# Commit all changes
git add .
git commit -m "Backup before Dev Container migration"
git push origin your-branch
```

### 2. Clean Up Local Dependencies (Optional)
```bash
# Remove local Ruby versions (if using rbenv)
rbenv versions
rbenv uninstall <version>

# Remove Node versions (if using nvm)
nvm list
nvm uninstall <version>

# Remove Homebrew packages (macOS)
brew uninstall postgresql redis
```

### 3. Start Fresh with Dev Container
```bash
# Close VS Code
# Open project in Dev Container as described above
# Your git history and code remain unchanged
```

## FAQ

### Can I use other editors besides VS Code?
Currently, Dev Containers work best with VS Code. Other editors like JetBrains IDEs have experimental support, but VS Code provides the most mature experience.

### Will this affect my local system?
No, Dev Containers run in complete isolation. Your local system remains unchanged, and you can run multiple containers simultaneously.

### Can I access the container's shell?
Yes, VS Code provides an integrated terminal that runs inside the container. You can also use `docker exec -it <container-name> bash` to access it directly.

### What happens to my data when I delete the container?
Your source code remains on your local system. Only the container environment is deleted. Database data and other volumes persist unless explicitly removed.

### How do I update the development environment?
Update the `.devcontainer` configuration files and rebuild the container using "Dev Containers: Rebuild Container" in VS Code.

---

**Need help?** Join our [Discord community](https://discord.gg/UABXyQQ82c) or open an issue on [GitHub](https://github.com/saeloun/miru-web/issues).
