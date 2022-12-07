#syntax=docker/dockerfile:1
ARG RUBY_VERSION=3.1.2

FROM ruby:$RUBY_VERSION-slim AS base

ARG NODE_VERSION=16.4.2
ARG BUNDLER_VERSION=2.3.11
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

RUN mkdir /app
WORKDIR /app
RUN mkdir -p tmp/pids

RUN apt-get update && apt-get install -y --no-install-recommends curl gnupg2 && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" > /etc/apt/sources.list.d/yarn.list && \
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    curl -sL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y --no-install-recommends nodejs yarn && \
    apt-get clean && rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

FROM base AS build-deps

RUN apt-get update && apt-get install -y --no-install-recommends git build-essential libpq-dev && \
    apt-get clean && rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*


FROM build-deps AS gems

RUN gem install bundler -v $BUNDLER_VERSION

COPY Gemfile Gemfile.lock ./

RUN bundle install &&  rm -rf vendor/bundle/ruby/*/cache

FROM base AS node_modules

COPY package.json yarn.lock ./

RUN yarn install --check-files

FROM base

RUN apt-get update && apt-get install -y --no-install-recommends postgresql-client-13 && \
    apt-get clean && rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

COPY --from=gems /app /app
COPY --from=gems /usr/local/bundle /usr/local/bundle
COPY --from=node_modules /app/node_modules /app/node_modules
COPY . ./
