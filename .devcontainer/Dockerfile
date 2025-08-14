# Miru 2.0 Multi-stage Dockerfile for Development & Testing
FROM miru-base:latest AS base

# Stage 2: Dependencies Installation
FROM base AS dependencies

WORKDIR /app

# Copy dependency manifests
COPY Gemfile Gemfile.lock ./
COPY package.json pnpm-lock.yaml ./

# Configure bundler for optimal performance
RUN bundle config set --local path 'vendor/bundle' && \
    bundle config set --local jobs 4 && \
    bundle config set --local retry 3 && \
    bundle install

# Install Node dependencies with pnpm
# Skip postinstall scripts (lefthook) in container
RUN pnpm install --frozen-lockfile --ignore-scripts && \
    pnpm store prune

# Stage 3: Development Environment
FROM base AS development

WORKDIR /app

# Copy installed dependencies from the dependencies stage
COPY --from=dependencies /usr/local/bundle /usr/local/bundle
COPY --from=dependencies /app/node_modules /app/node_modules

# Development environment variables
ENV BUNDLE_PATH=/usr/local/bundle \
    BUNDLE_BIN=/usr/local/bundle/bin \
    GEM_HOME=/usr/local/bundle \
    PATH="/usr/local/bundle/bin:${PATH}" \
    # Rails development settings
    RAILS_ENV=development \
    NODE_ENV=development \
    # Playwright browser paths
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    # Enable better error messages
    RAILS_LOG_TO_STDOUT=true \
    MALLOC_ARENA_MAX=2 \
    WEB_CONCURRENCY=2

# Create necessary directories with proper permissions
RUN mkdir -p /tmp/pids /app/tmp/cache /app/log && \
    chmod -R 755 /tmp/pids /app/tmp /app/log

# Stage 4: Test Environment (extends development)
FROM development AS test

# Test-specific environment variables
ENV RAILS_ENV=test \
    NODE_ENV=test \
    CI=true \
    # Playwright headless mode
    PLAYWRIGHT_HEADLESS=true \
    # Parallel test configuration
    PARALLEL_WORKERS=4 \
    # Disable Spring in tests
    DISABLE_SPRING=true

# Prepare test database
RUN bundle exec rails db:test:prepare || true

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Default command for test environment
CMD ["bundle", "exec", "rspec"]