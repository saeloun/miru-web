#syntax=docker/dockerfile:1
ARG VARIANT=3.2.4
FROM mcr.microsoft.com/vscode/devcontainers/ruby:${VARIANT} AS base

# Update args in docker-compose.yaml to set the UID/GID of the "vscode" user.
# ARG USER_UID=1000
# ARG USER_GID=$USER_UID
# RUN if [ "$USER_GID" != "1000" ] || [ "$USER_UID" != "1000" ]; then \
#     groupmod --gid $USER_GID vscode \
#     && usermod --uid $USER_UID --gid $USER_GID vscode \
#     && chmod -R $USER_UID:$USER_GID /home/vscode; \
#     fi

ARG NODE_VERSION=22.18.0

ENV BUNDLE_PATH="/usr/local/bundle"
ENV GEM_HOME="/usr/local/bundle/gems"
ENV GEM_PATH="/usr/local/bundle/gems"

RUN mkdir /app
WORKDIR /app
RUN mkdir -p tmp/pids

RUN apt-get update && apt-get install -y --no-install-recommends curl gnupg2 && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    npm install -g pnpm@9.15.2 && \
    npm --version && pnpm --version && \
    apt-get clean && rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*


RUN curl --location --silent https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update && apt-get install google-chrome-stable -y --no-install-recommends postgresql-client && \
    apt-get clean && rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

# Install gh
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && sudo apt update \
    && sudo apt install gh


FROM base AS build-deps

RUN apt-get update && apt-get install -y --no-install-recommends git build-essential libpq-dev && \
    apt-get clean && rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*


FROM build-deps AS gems

RUN gem install bundler -v 2.3.11

COPY Gemfile Gemfile.lock ./

RUN bundle install &&  rm -rf vendor/bundle/ruby/*/cache

FROM base AS node_modules

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

FROM base


COPY --from=gems /app /app
COPY --from=gems /usr/local/bundle /usr/local/bundle
COPY --from=node_modules /app/node_modules /app/node_modules
COPY . ./
