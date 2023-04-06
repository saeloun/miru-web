#!/bin/bash

set -eu

bin/rails db:create
bin/rails db:migrate
bin/rails assets:precompile

bundle exec rspec --color spec/system/
