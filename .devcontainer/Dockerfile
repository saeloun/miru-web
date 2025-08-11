# Multi-stage Dockerfile for development environment
FROM miru-base:latest AS base

# Stage 2: Dependencies
FROM base AS dependencies

WORKDIR /app

# Copy dependency files
COPY Gemfile Gemfile.lock ./
COPY package.json pnpm-lock.yaml ./

# Install Ruby dependencies
RUN bundle config set --local path 'vendor/bundle' && \
    bundle install --jobs 4 --retry 3

# Install Node dependencies (skip postinstall for lefthook)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Stage 3: Development environment
FROM base AS development

WORKDIR /app

# Copy installed dependencies from the dependencies stage
COPY --from=dependencies /usr/local/bundle /usr/local/bundle
COPY --from=dependencies /app/node_modules /app/node_modules

# Set environment variables
ENV BUNDLE_PATH=/usr/local/bundle \
    BUNDLE_BIN=/usr/local/bundle/bin \
    GEM_HOME=/usr/local/bundle \
    PATH="/usr/local/bundle/bin:${PATH}" \
    DISPLAY=:99 \
    CHROME_BIN=/usr/bin/chromium

# Create necessary directories
RUN mkdir -p /tmp/pids

# Stage 4: Test environment (extends development)
FROM development AS test

# Install additional test dependencies
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends xvfb && \
    rm -rf /var/lib/apt/lists/*

# Set test environment variables
ENV RAILS_ENV=test \
    CI=true

# Start Xvfb for headless Chrome
RUN echo '#!/bin/bash\nXvfb :99 -ac -screen 0 1280x1024x24 &\nexec "$@"' > /entrypoint.sh && \
    chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

# Default command for development
CMD ["bash"]