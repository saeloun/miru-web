#!/bin/bash

set -eu

bundle install --without development production test
bin/yarn install
bin/rails db:create
bin/rails db:migrate
bin/rails assets:precompile

bundle exec rspec --color spec/system/
