# syntax=docker/dockerfile:1
# Miru 2.0 - Optimized Multi-Stage Dockerfile
# Leverages layer caching for faster builds

# Stage 1: Base Ruby image with system dependencies
FROM ruby:3.4.5-slim AS base

# Install only runtime dependencies
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
    libpq-dev \
    postgresql-client \
    curl \
    gnupg \
    ca-certificates \
    libvips \
    imagemagick \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 22 LTS (runtime only)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Stage 2: Build dependencies
FROM base AS build-deps

# Install build dependencies
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm@9.15.5

# Set environment variables from original config
ENV BUNDLE_PATH=/usr/local/bundle \
    BUNDLE_BIN=/usr/local/bundle/bin \
    GEM_HOME=/usr/local/bundle \
    PATH="/usr/local/bundle/bin:${PATH}" \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0

WORKDIR /app

# Stage 3: Ruby dependencies
FROM build-deps AS ruby-deps

# Copy only Gemfile for better caching
COPY Gemfile Gemfile.lock ./

# Install gems with optimal settings and cache mount
RUN --mount=type=cache,target=/tmp/bundle-cache \
    bundle config set --local deployment 'true' && \
    bundle config set --local without 'development test' && \
    bundle config set --local jobs $(nproc) && \
    bundle config set --local retry 3 && \
    bundle config set --local path /tmp/bundle-cache && \
    bundle install && \
    cp -ar /tmp/bundle-cache/* /usr/local/bundle/ && \
    bundle clean --force && \
    rm -rf /usr/local/bundle/cache/*.gem && \
    find /usr/local/bundle/gems/ -name "*.c" -delete && \
    find /usr/local/bundle/gems/ -name "*.o" -delete

# Stage 4: Node dependencies
FROM build-deps AS node-deps

# Copy only package files for better caching
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile --ignore-scripts && \
    pnpm store prune

# Stage 5: Asset compilation
FROM build-deps AS assets

# Copy node modules from node-deps
COPY --from=node-deps /app/node_modules /app/node_modules

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including dev) for building
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy application code
COPY . .

# Copy gems from ruby-deps
COPY --from=ruby-deps /usr/local/bundle /usr/local/bundle

# Build assets
RUN SECRET_KEY_BASE=dummy RAILS_ENV=production bundle exec rails assets:precompile && \
    rm -rf node_modules tmp/cache

# Stage 6: Development image
FROM build-deps AS development

ENV RAILS_ENV=development \
    NODE_ENV=development \
    MALLOC_ARENA_MAX=2 \
    WEB_CONCURRENCY=2 \
    RAILS_LOG_TO_STDOUT=true \
    BUNDLE_PATH=/usr/local/bundle \
    BUNDLE_BIN=/usr/local/bundle/bin \
    GEM_HOME=/usr/local/bundle \
    PATH="/usr/local/bundle/bin:${PATH}" \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

WORKDIR /app

# Copy everything for development
COPY . .

# Install all dependencies
RUN bundle install && \
    pnpm install --frozen-lockfile

# Install Playwright for development
RUN pnpm exec playwright install chromium --with-deps

EXPOSE 3000
CMD ["bin/rails", "server", "-b", "0.0.0.0"]

# Stage 7: Test image
FROM build-deps AS test

ENV RAILS_ENV=test \
    NODE_ENV=test \
    CI=true \
    PLAYWRIGHT_HEADLESS=true \
    PARALLEL_WORKERS=4 \
    DISABLE_SPRING=true \
    BUNDLE_PATH=/usr/local/bundle \
    BUNDLE_BIN=/usr/local/bundle/bin \
    GEM_HOME=/usr/local/bundle \
    PATH="/usr/local/bundle/bin:${PATH}" \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

WORKDIR /app

# Copy gems from ruby-deps (but with test gems)
COPY Gemfile Gemfile.lock ./
RUN bundle config set --local deployment 'false' && \
    bundle config set --local with 'test' && \
    bundle install

# Copy node modules and install test dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# Install Playwright chromium
RUN pnpm exec playwright install chromium --with-deps

# Copy application code
COPY . .

# Prepare test database
RUN bundle exec rails db:test:prepare || true

CMD ["bundle", "exec", "rspec"]

# Stage 8: Production image (minimal)
FROM base AS production

ENV RAILS_ENV=production \
    NODE_ENV=production \
    RAILS_SERVE_STATIC_FILES=true \
    RAILS_LOG_TO_STDOUT=true

WORKDIR /app

# Create non-root user
RUN useradd -m -s /bin/bash rails && \
    mkdir -p /app/log /app/tmp /app/storage && \
    chown -R rails:rails /app

# Copy only necessary files from build stages
COPY --from=ruby-deps --chown=rails:rails /usr/local/bundle /usr/local/bundle
COPY --from=assets --chown=rails:rails /app/public /app/public
COPY --chown=rails:rails . .

# Switch to non-root user
USER rails

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000

# Use exec form for proper signal handling
ENTRYPOINT ["bundle", "exec"]
CMD ["puma", "-C", "config/puma.rb"]