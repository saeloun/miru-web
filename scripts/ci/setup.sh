#!/bin/bash

set -eu

bundle config set --local with 'test'
bundle config set --local without 'development production ci'

pnpm install --frozen-lockfile

bundle exec rake db:reset
bundle config set --local without ''
