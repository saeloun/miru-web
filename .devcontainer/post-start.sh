#!/bin/bash

# Rails 8 DevContainer Post Start Script
set -e

echo "🌟 Rails 8 DevContainer Post Start Setup..."

# Ensure services are running
echo "🔄 Checking services..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until pg_isready -h localhost -p 5432; do
  sleep 1
done

# Wait for Redis to be ready  
echo "⏳ Waiting for Redis..."
until redis-cli -h localhost -p 6379 ping | grep -q "PONG"; do
  sleep 1
done

# Wait for Elasticsearch to be ready
echo "⏳ Waiting for Elasticsearch..."
until curl -s http://localhost:9200/_cluster/health | grep -q "yellow\|green"; do
  sleep 1
done

# Start background services if needed
echo "🚀 Starting background services..."

# Start Solid Queue in background if not running
if ! pgrep -f "solid_queue" > /dev/null; then
  echo "Starting Solid Queue worker..."
  bundle exec rake solid_queue:start &
fi

# Ensure database is migrated
echo "📊 Ensuring database is up to date..."
bundle exec rails db:migrate

# Install any new gems that may have been added
echo "💎 Installing any new gems..."
bundle check || bundle install

# Install any new npm packages
echo "📦 Installing any new npm packages (pnpm)..."
pnpm install --frozen-lockfile || true

echo "✅ Rails 8 DevContainer ready for development!"
echo ""
echo "🌐 Access your application:"
echo "  Rails App: http://localhost:3000"
echo "  Mission Control Jobs: http://localhost:3000/jobs (if enabled)"
echo "  PgHero: http://localhost:3000/pghero"
echo ""
