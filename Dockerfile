# syntax=docker/dockerfile:1
# check=error=true

# This Dockerfile supports both production and development builds.
# For production: docker build --target=production -t miru .
# For development: docker build --target=development -t miru-dev .
# Use with Kamal for deployment or docker-compose for local development.

# Make sure RUBY_VERSION matches the Ruby version in .ruby-version
ARG RUBY_VERSION=4.0.9
# Build from the verified release until Docker Hub publishes the security patch.
FROM debian:trixie-slim AS ruby-build
ARG RUBY_VERSION
ARG RUBY_SHA256=a8057adb39f51ad6dc3106237504c93dd792bb515837b4fe7817ae21ed7e51f4
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential ca-certificates curl \
    libffi-dev libgmp-dev libreadline-dev libssl-dev libyaml-dev ruby rustc xz-utils zlib1g-dev && \
    curl -fsSL "https://cache.ruby-lang.org/pub/ruby/4.0/ruby-${RUBY_VERSION}.tar.xz" -o /tmp/ruby.tar.xz && \
    echo "${RUBY_SHA256}  /tmp/ruby.tar.xz" | sha256sum -c - && \
    mkdir /tmp/ruby && tar -xJf /tmp/ruby.tar.xz -C /tmp/ruby --strip-components=1 && \
    cd /tmp/ruby && \
    LDFLAGS="-Wl,-z,relro -Wl,-z,now" ./configure --enable-shared --enable-yjit --disable-install-doc && \
    make -j 4 && make install

FROM debian:trixie-slim AS base
ARG RUBY_VERSION
ENV LANG=C.UTF-8 \
    GEM_HOME=/usr/local/bundle \
    BUNDLE_APP_CONFIG=/usr/local/bundle \
    BUNDLE_SILENCE_ROOT_WARNING=1
ENV PATH=/usr/local/bundle/bin:$PATH
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y ca-certificates libcrypt1 libffi8 \
    libgmp10 libreadline8t64 libssl3t64 libyaml-0-2 zlib1g && \
    rm -rf /var/lib/apt/lists/*
COPY --from=ruby-build /usr/local/ /usr/local/
RUN ldconfig && mkdir -p /usr/local/bundle && chmod 1777 /usr/local/bundle && \
    ruby -ropenssl -rpsych -rzlib -e 'abort "Unexpected Ruby" unless RUBY_VERSION == ARGV.fetch(0); abort "YJIT unavailable" unless RubyVM::YJIT.respond_to?(:enable)' "${RUBY_VERSION}"

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
ARG NODE_VERSION=24.22.1
ARG NODE_BUILD_COMMIT=9a3d47916225d39d53b6305f3be91c7fb3e3875f
ARG NODE_BUILD_SHA256=ff474d52fe7d2f1d60a337facb4924530a7b406b187f2843f36beb6be897af9f
ENV PATH=/usr/local/node/bin:$PATH
RUN curl -fsSL "https://github.com/nodenv/node-build/archive/${NODE_BUILD_COMMIT}.tar.gz" -o /tmp/node-build.tar.gz && \
    echo "${NODE_BUILD_SHA256}  /tmp/node-build.tar.gz" | sha256sum -c - && \
    tar xzf /tmp/node-build.tar.gz -C /tmp/ && \
    "/tmp/node-build-${NODE_BUILD_COMMIT}/bin/node-build" "${NODE_VERSION}" /usr/local/node && \
    rm -rf /tmp/node-build*

# Install pnpm
RUN npm install -g pnpm@9.15.9


# Development stage for local development
FROM base AS development

# Install packages needed for development
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential git libffi-dev libpq-dev libyaml-dev node-gyp pkg-config python-is-python3 chromium chromium-sandbox fonts-noto-core && \
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
    PUPPETEER_SKIP_DOWNLOAD=true pnpm install --frozen-lockfile --ignore-scripts

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
    PUPPETEER_SKIP_DOWNLOAD=true pnpm install --frozen-lockfile --ignore-scripts

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
    apt-get install --no-install-recommends -y chromium chromium-sandbox fonts-noto-core imagemagick libvips && \
    fc-list :charset=0906 | grep -q . && \
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
CMD ["bundle", "exec", "falcon", "host"]
