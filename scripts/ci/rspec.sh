#!/bin/bash

set -eu

export RAILS_ENV=test
bundle install --with test
bin/yarn install
rake db:drop
rake db:create
rake db:migrate
bundle exec rspec --color spec
