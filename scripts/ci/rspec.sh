#!/bin/bash

set -eu

export RAILS_ENV=test
bundle install --with test
bin/yarn install
bin/rails db:environment:set RAILS_ENV=test
bin/rails db:drop
bin/rails db:create
bin/rails db:migrate
bundle exec rspec --color spec
