#!/bin/bash

set -eu

bin/yarn install
bundle exec rake assets:precompile
bundle install --with test
bundle exec rspec --color spec
