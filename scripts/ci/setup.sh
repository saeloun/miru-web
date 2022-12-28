#!/bin/bash

set -eu

bundle install --with test

yarn install

bundle exec rails webpacker:compile

bundle exec rake db:reset