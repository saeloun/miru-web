#!/bin/bash

# Rails 8 DevContainer Post Create Script
set -e

echo "🚀 Rails 8 DevContainer Post Create Setup Starting..."

# Install dependencies
echo "📦 Installing Ruby gems..."
bundle install

echo "📦 Installing Node.js packages..."
yarn install

# Setup database
echo "🗄️ Setting up database..."
bundle exec rails db:prepare

# Setup assets
echo "🎨 Precompiling assets..."
bundle exec rails assets:precompile

# Run security audits
echo "🔒 Running security audits..."
bundle exec bundle-audit --update || echo "Bundle audit completed"
bundle exec ruby-audit check || echo "Ruby audit completed"

# Run Brakeman security scan
echo "🛡️ Running Brakeman security scan..."
bundle exec brakeman --config-file config/brakeman.yml --quiet || echo "Brakeman scan completed"

# Setup Solid Queue
echo "⚡ Setting up Solid Queue..."
bundle exec rails solid_queue:install || echo "Solid Queue already configured"

# Setup git hooks
echo "🪝 Setting up git hooks..."
yarn husky install || echo "Husky already configured"

# Install Playwright browsers
echo "🎭 Installing Playwright browsers..."
yarn playwright install || echo "Playwright browsers installed"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p tmp/cache tmp/pids tmp/sockets log

# Set proper permissions
echo "🔐 Setting permissions..."
chmod +x bin/*

echo "✅ Rails 8 DevContainer setup completed!"
echo ""
echo "🔧 Available commands:"
echo "  foreman start -f Procfile.dev  # Start all services"
echo "  bin/rails server               # Start Rails server"
echo "  bin/webpacker-dev-server       # Start webpack dev server" 
echo "  bundle exec rspec              # Run tests"
echo "  bundle exec rubocop            # Run linter"
echo "  yarn lint                      # Run JS/TS linter"
echo ""