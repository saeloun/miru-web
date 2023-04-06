#!/bin/bash

set -eu

bin/rails db:create
bin/rails db:migrate
bundle exec rspec --color --exclude-pattern "spec/system/**/*.rb"
