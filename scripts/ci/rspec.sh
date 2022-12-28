#!/bin/bash

set -eu

yarn install
rake assets:precompile
bundle install --with test
bundle exec rspec --color spec
