#!/bin/bash

set -eu

export BUNDLE_PATH=vendor/bundle

bin/yarn install
bin/rails db:create
bin/rails db:migrate
bin/rails assets:precompile

bundle exec rspec --color spec/system/
