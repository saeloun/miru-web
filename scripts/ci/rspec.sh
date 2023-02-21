#!/bin/bash

set -eu

bundle install --without development production test
bin/yarn install
bin/rails db:create
bin/rails db:migrate
bundle exec rspec --color --exclude-pattern "spec/system/**/*.rb"
