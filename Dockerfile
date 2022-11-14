# More GemCache Optmization, without using Azures Cache
# https://codetales.io/blog/speeding-up-bundler-in-dockerized-environments
# Dockerfile https://gist.github.com/sethwebster/ce7b5e81aba09b65066683c33f882fe9

FROM ruby:3.1.2

RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg -o /root/yarn-pubkey.gpg && apt-key add /root/yarn-pubkey.gpg
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" > /etc/apt/sources.list.d/yarn.list

RUN apt-get update -qq && apt-get install -y build-essential libpq-dev \
    curl gnupg2 apt-utils default-mysql-client git libcurl3-dev cmake \
    libssl-dev pkg-config openssl imagemagick file nodejs yarn

RUN gem install bundler -v 2.3.11
ENV BUNDLER_VERSION=2.3.11

WORKDIR /app

COPY Gemfile Gemfile.lock ./
RUN  bundle install

COPY . .

COPY package.json yarn.lock ./

RUN yarn install

ENV SECRET_KEY_BASE 1
ENV AWS_ACCESS_KEY_ID=1
ENV AWS_SECRET_ACCESS_KEY=1
ENV APP_BASE_URL = "https://miru-web.fly.dev"


RUN RAILS_ENV=production rails assets:precompile

# ENV PORT 3000
# EXPOSE $PORT
