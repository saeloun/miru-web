# syntax=docker/dockerfile:1
FROM ruby:3.1.2
RUN curl https://deb.nodesource.com/setup_16.x | bash
RUN curl https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update -qq && apt-get install -y nodejs postgresql-client yarn nano
WORKDIR /app

# Install bundle of gems
COPY Gemfile /app/Gemfile
COPY Gemfile.lock /app/Gemfile.lock
RUN bundle install

# Install yarn packages
COPY package.json /app/package.json
COPY yarn.lock /app/yarn.lock
RUN yarn install

COPY . /app

ENV RAILS_ENV='production'
ENV RACK_ENV='production'

# RUN rails db:migrate
RUN bin/webpack
RUN rails assets:precompile
RUN rails assets:clean

# Add a script to be executed every time the container starts.
COPY entrypoint.sh /usr/bin/
RUN chmod +x /usr/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]
EXPOSE 3000

# Configure the main process to run when running the image
CMD ["rails", "server", "-b", "0.0.0.0"]
