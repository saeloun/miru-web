#!/bin/bash

set -eu

export RAILS_ENV=test
bundle install --with test
bin/yarn install
bin/rails db:environment:set RAILS_ENV=test
rake db:create
rake db:migrate
bundle exec rspec --color spec
