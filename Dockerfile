# syntax=docker/dockerfile:1
# check=error=true

# This Dockerfile supports both production and development builds.
# For production: docker build --target=production -t miru .
# For development: docker build --target=development -t miru-dev .
# Use with Kamal for deployment or docker-compose for local development.

# Make sure RUBY_VERSION matches the Ruby version in .ruby-version
ARG RUBY_VERSION=3.4.5
FROM ruby:$RUBY_VERSION-slim AS base

LABEL fly_launch_runtime="rails"

# Rails app lives here
WORKDIR /rails

# Update gems and bundler
RUN gem update --system --no-document && \
    gem install -N bundler

# Install base packages needed to install nodejs and chrome
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y curl gnupg libjemalloc2 libvips postgresql-client && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Set production environment
ENV BUNDLE_DEPLOYMENT="1" \
    BUNDLE_PATH="/usr/local/bundle" \
    BUNDLE_WITHOUT="development:test" \
    RAILS_ENV="production"

# Install Node.js
ARG NODE_VERSION=22.11.0
ENV PATH=/usr/local/node/bin:$PATH
RUN curl -sL https://github.com/nodenv/node-build/archive/master.tar.gz | tar xz -C /tmp/ && \
    /tmp/node-build-master/bin/node-build "${NODE_VERSION}" /usr/local/node && \
    rm -rf /tmp/node-build-master

# Install pnpm
RUN npm install -g pnpm@9


# Development stage for local development
FROM base AS development

# Install packages needed for development
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential git libffi-dev libpq-dev libyaml-dev node-gyp pkg-config python-is-python3 chromium chromium-sandbox && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Unset production environment for development
ENV BUNDLE_DEPLOYMENT="" \
    BUNDLE_WITHOUT="" \
    RAILS_ENV="development"

# Install all gems including development
COPY Gemfile Gemfile.lock ./
RUN --mount=type=cache,id=bundle-cache,target=/usr/local/bundle/cache \
    bundle install --jobs 4 --retry 3

# Install node modules for development (skip scripts to avoid git-dependent hooks, then rebuild)
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    NODE_ENV=production PUPPETEER_SKIP_DOWNLOAD=true pnpm install --frozen-lockfile --ignore-scripts && \
    NODE_ENV=production pnpm rebuild

# Copy application code
COPY . .

# Entrypoint for development
ENTRYPOINT ["/rails/bin/docker-entrypoint"]
CMD ["bin/rails", "server", "-b", "0.0.0.0"]

# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build gems and node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential git libffi-dev libpq-dev libyaml-dev node-gyp pkg-config python-is-python3 && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Build options
ENV PATH="/usr/local/node/bin:$PATH" \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true" \
    NODE_ENV="production"

# Install application gems
COPY Gemfile Gemfile.lock ./
RUN --mount=type=cache,id=bundle-cache,target=/usr/local/bundle/cache \
    bundle install --jobs 4 --retry 3 && \
    rm -rf ~/.bundle/ /root/.cache/gem "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git && \
    bundle exec bootsnap precompile --gemfile

# Install node modules with pnpm
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    PUPPETEER_SKIP_DOWNLOAD=true pnpm install --frozen-lockfile --prod

# Copy application code
COPY . .

# Precompile bootsnap code for faster boot times
RUN bundle exec bootsnap precompile app/ lib/

# Precompiling assets for production without requiring secret RAILS_MASTER_KEY
# Also build Vite assets
RUN SECRET_KEY_BASE_DUMMY=1 ./bin/rails assets:precompile && \
    if [ -f "bin/vite" ]; then SECRET_KEY_BASE=DUMMY bin/vite build; fi && \
    rm -rf tmp/cache tmp/pids node_modules/.cache


# Final stage for production app image
FROM base AS production

# Install packages needed for deployment
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y chromium chromium-sandbox imagemagick libvips && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives && \
    rm -rf /usr/local/node || true

# Copy built artifacts: gems, application
COPY --from=build "${BUNDLE_PATH}" "${BUNDLE_PATH}"
COPY --from=build /rails /rails

# Run and own only the runtime files as a non-root user for security
RUN groupadd --system --gid 1000 rails && \
    useradd rails --uid 1000 --gid 1000 --create-home --shell /bin/bash && \
    chown -R 1000:1000 db log storage tmp
USER 1000:1000

# Deployment options
ENV GROVER_NO_SANDBOX="true" \
    PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium"

# Entrypoint prepares the database.
ENTRYPOINT ["/rails/bin/docker-entrypoint"]

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
