#!/bin/bash

set -eu

bundle config set --local with 'ci'
bundle config set --local without 'development production test'
bin/yarn install
bin/rails db:create
bin/rails db:migrate
bundle exec rspec --color --exclude-pattern "spec/system/**/*.rb"
bundle config set --local without ''
