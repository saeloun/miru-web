# syntax = docker/dockerfile:experimental
ARG RUBY_VERSION=3.4.5
ARG VARIANT=jemalloc-slim
FROM quay.io/evl.ms/fullstaq-ruby:${RUBY_VERSION}-${VARIANT} as base

ARG NODE_VERSION=22.11.0
ARG BUNDLER_VERSION=2.4.10
ARG YARN_VERSION=1.22.22

ARG RAILS_ENV=production
ENV RAILS_ENV=${RAILS_ENV}

ENV RAILS_SERVE_STATIC_FILES true
ENV RAILS_LOG_TO_STDOUT true

ARG BUNDLE_WITHOUT=development:test:ci
ARG BUNDLE_PATH=vendor/bundle
ENV BUNDLE_PATH ${BUNDLE_PATH}
ENV BUNDLE_WITHOUT ${BUNDLE_WITHOUT}


# We don't need the standalone Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

RUN mkdir /app
WORKDIR /app
RUN mkdir -p tmp/pids

SHELL ["/bin/bash", "-c"]

RUN curl https://get.volta.sh | bash

ENV BASH_ENV ~/.bashrc
ENV VOLTA_HOME /root/.volta
ENV PATH $VOLTA_HOME/bin:/usr/local/bin:$PATH

RUN volta install node@${NODE_VERSION} && volta install yarn@${YARN_VERSION}

FROM base as build_deps

ARG DEV_PACKAGES="git build-essential libpq-dev wget vim curl gzip xz-utils libsqlite3-dev libjemalloc2"
ENV DEV_PACKAGES ${DEV_PACKAGES}

RUN --mount=type=cache,id=dev-apt-cache,sharing=locked,target=/var/cache/apt \
    --mount=type=cache,id=dev-apt-lib,sharing=locked,target=/var/lib/apt \
    apt-get update -qq && \
    apt-get install --no-install-recommends -y ${DEV_PACKAGES} \
    && rm -rf /var/lib/apt/lists /var/cache/apt/archives

ENV LD_PRELOAD=/usr/lib/x86_64-linux-gnu/libjemalloc.so.2
ENV MALLOC_CONF=dirty_decay_ms:1000,narenas:2,background_thread:true

FROM build_deps as gems

RUN gem update --system --no-document && \
    gem install -N bundler -v ${BUNDLER_VERSION}

COPY Gemfile* ./
RUN bundle install &&  rm -rf vendor/bundle/ruby/*/cache

FROM build_deps as node_modules

COPY package*json ./
COPY yarn.* ./

RUN yarn install

FROM base

ARG PROD_PACKAGES="postgresql-client file vim curl gzip libsqlite3-0 gnupg"
ENV PROD_PACKAGES=${PROD_PACKAGES}

RUN --mount=type=cache,id=prod-apt-cache,sharing=locked,target=/var/cache/apt \
    --mount=type=cache,id=prod-apt-lib,sharing=locked,target=/var/lib/apt \
    apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    ${PROD_PACKAGES} \
    && curl --location --silent https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install google-chrome-stable -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists /var/cache/apt/archives

COPY --from=gems /app /app
COPY --from=node_modules /app/node_modules /app/node_modules
COPY --from=gems /usr/lib/fullstaq-ruby/versions /usr/lib/fullstaq-ruby/versions
COPY --from=gems /usr/local/bundle /usr/local/bundle

# The following enable assets to precompile on the build server.  Adjust
# as necessary.  If no combination works for you, see:
# https://fly.io/docs/rails/getting-started/existing/#access-to-environment-variables-at-build-time
ENV SECRET_KEY_BASE 1
# ENV AWS_ACCESS_KEY_ID=1
# ENV AWS_SECRET_ACCESS_KEY=1
ENV APP_BASE_URL = "https://miru-staging.fly.dev"

COPY . .

RUN chmod +x /app/bin/* && \
    sed -i 's/ruby.exe/ruby/' /app/bin/* && \
    sed -i '/^#!/aDir.chdir File.expand_path("..", __dir__)' /app/bin/*

RUN bin/rails fly:build

ENV PORT 8080

ARG SERVER_COMMAND="bin/rails fly:server"
ENV SERVER_COMMAND ${SERVER_COMMAND}
CMD ${SERVER_COMMAND}
