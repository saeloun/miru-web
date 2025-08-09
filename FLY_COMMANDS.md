# Fly.io Commands for Miru

## Authentication
Your Fly.io token has been configured and added to your ~/.zshrc file.

## Available Apps
- **miru-production** - Main production app
- **miru-production-db** - Production database
- **miru-staging** - Staging environment
- **miru-staging-db** - Staging database
- **miru-elastic-search** - Elasticsearch service

## Common Fly.io Commands

### App Status & Information
```bash
# List all apps
fly apps list

# Show app status
fly status -a miru-production
fly status -a miru-staging

# Show app configuration
fly config show -a miru-production
fly config show -a miru-staging

# View app logs
fly logs -a miru-production
fly logs -a miru-staging --tail

# SSH into app
fly ssh console -a miru-production
fly ssh console -a miru-staging
```

### Deployment Commands
```bash
# Deploy to staging
fly deploy -a miru-staging

# Deploy to production
fly deploy -a miru-production

# Deploy with specific Dockerfile
fly deploy -a miru-staging --dockerfile deployment/fly/Dockerfile

# Deploy without cache
fly deploy -a miru-staging --no-cache

# Deploy specific Docker image
fly deploy -a miru-production --image <image-name>
```

### Scaling & Resources
```bash
# Scale app instances
fly scale count 2 -a miru-production
fly scale count 1 -a miru-staging

# Scale VM size
fly scale vm shared-cpu-1x -a miru-production
fly scale vm shared-cpu-2x -a miru-production

# Show current scale
fly scale show -a miru-production

# Autoscaling
fly autoscale set min=1 max=3 -a miru-production
```

### Environment Variables & Secrets
```bash
# List secrets
fly secrets list -a miru-production

# Set a secret
fly secrets set SECRET_KEY=value -a miru-production

# Set multiple secrets
fly secrets set SECRET1=value1 SECRET2=value2 -a miru-production

# Import secrets from .env file
fly secrets import < .env.production -a miru-production

# Unset a secret
fly secrets unset SECRET_KEY -a miru-production
```

### Database Management
```bash
# Connect to production database
fly postgres connect -a miru-production-db

# Create database backup
fly postgres backup create -a miru-production-db

# List backups
fly postgres backup list -a miru-production-db

# Restore from backup
fly postgres backup restore <backup-id> -a miru-production-db
```

### Monitoring & Debugging
```bash
# View metrics
fly metrics -a miru-production

# Check app health
fly checks list -a miru-production

# View recent deployments
fly releases -a miru-production

# Rollback to previous version
fly deploy --image <previous-image> -a miru-production

# Open app in browser
fly open -a miru-production
fly open -a miru-staging
```

### Rails-Specific Commands
```bash
# Run Rails console
fly ssh console -a miru-production -C "bin/rails console"

# Run database migrations
fly ssh console -a miru-production -C "bin/rails db:migrate"

# Run rake tasks
fly ssh console -a miru-production -C "bin/rails <task_name>"

# Access Rails logs
fly ssh console -a miru-production -C "tail -f log/production.log"
```

### Certificates & Domains
```bash
# List certificates
fly certs list -a miru-production

# Add custom domain
fly certs add example.com -a miru-production

# Show certificate details
fly certs show example.com -a miru-production

# Check certificate status
fly certs check example.com -a miru-production
```

### Useful Deployment Scripts

#### Deploy to Staging
```bash
#!/bin/bash
echo "Deploying to staging..."
export FLY_API_TOKEN="your-token-here"
fly deploy -a miru-staging --dockerfile deployment/fly/Dockerfile
```

#### Deploy to Production with Confirmation
```bash
#!/bin/bash
echo "Are you sure you want to deploy to PRODUCTION? (yes/no)"
read confirm
if [ "$confirm" = "yes" ]; then
    export FLY_API_TOKEN="your-token-here"
    fly deploy -a miru-production --dockerfile deployment/fly/Dockerfile
else
    echo "Deployment cancelled"
fi
```

#### Quick Status Check
```bash
#!/bin/bash
echo "=== PRODUCTION STATUS ==="
fly status -a miru-production
echo ""
echo "=== STAGING STATUS ==="
fly status -a miru-staging
```

## Tips
- Always test deployments on staging before production
- Use `fly logs --tail` to monitor deployments in real-time
- Keep your Fly CLI updated: `fly version update`
- Use `fly doctor` to diagnose connection issues
- The token is now permanently set in your shell configuration

## Emergency Commands
```bash
# Stop an app
fly apps suspend -a miru-production

# Resume an app
fly apps resume -a miru-production

# Restart an app
fly apps restart -a miru-production

# Scale to zero (emergency stop)
fly scale count 0 -a miru-production
```