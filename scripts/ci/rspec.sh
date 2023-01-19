#!/bin/bash

set -eu

bundle install --with test
bin/yarn install
bundle exec rake assets:precompile
bundle install --with test
bundle exec rspec --color spec
