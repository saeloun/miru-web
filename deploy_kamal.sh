#!/bin/bash
set -e

echo "🚀 Miru 2.0 Upgrade - Kamal Deployment Script"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.kamal exists
if [ ! -f .env.kamal ]; then
    echo -e "${RED}❌ .env.kamal file not found!${NC}"
    echo "Please create .env.kamal with your deployment credentials"
    exit 1
fi

# Load environment variables
export $(cat .env.kamal | grep -v '^#' | xargs)

# Check required variables
required_vars=(
    "GITHUB_TOKEN"
    "RAILS_MASTER_KEY"
    "DATABASE_URL"
    "SECRET_KEY_BASE"
    "POSTGRES_PASSWORD"
)

echo "Checking required environment variables..."
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ $var is not set${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ $var is set${NC}"
    fi
done

# Set default SECRET_KEY_BASE if placeholder
if [ "$SECRET_KEY_BASE" = "your_secret_key_base_here" ]; then
    echo -e "${YELLOW}⚠️  Generating SECRET_KEY_BASE...${NC}"
    export SECRET_KEY_BASE="92f9b55fa1e2135f147c5844fb6679116544bb78d4e3b66c8292b582294a4859d9691d5f3e714b7ff410a272c081877979a8402b5dc10787aad2d7ede2ddea93"
fi

# Build assets first
echo -e "\n${YELLOW}📦 Building assets...${NC}"
RAILS_ENV=production bin/rails assets:precompile

# Check SSH access to server
echo -e "\n${YELLOW}🔐 Checking SSH access to server...${NC}"
if ssh -o ConnectTimeout=5 root@redacted-host.example "echo 'SSH connection successful'"; then
    echo -e "${GREEN}✅ SSH connection successful${NC}"
else
    echo -e "${RED}❌ Cannot connect to server via SSH${NC}"
    echo "Please ensure you have SSH access to root@redacted-host.example"
    exit 1
fi

# Deploy with Kamal
echo -e "\n${YELLOW}🚢 Starting Kamal deployment...${NC}"

# First time setup (uncomment if needed)
# kamal setup

# Regular deployment
kamal deploy

echo -e "\n${GREEN}✅ Deployment complete!${NC}"
echo "Application should be available at: https://miru-2-0-upgrade.review.miru.so"
echo ""
echo "Useful commands:"
echo "  kamal logs        # View application logs"
echo "  kamal console     # Rails console on server"
echo "  kamal app restart # Restart application"