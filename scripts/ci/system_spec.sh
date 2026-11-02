#!/bin/bash

set -eu

bundle config set --local with 'ci'
bundle config set --local without 'development production test'
pnpm install --frozen-lockfile
bin/rails db:create
bin/rails runner 'ActiveRecord::Base.connection_pool.migration_context.migrate'
bin/rails assets:precompile

bundle exec rspec --color spec/system/
bundle config set --local without ''
