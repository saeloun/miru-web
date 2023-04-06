#!/bin/bash

set -eu

bundle config set --local with 'test'
bundle config set --local without 'development production ci'
bundle install
bundle exec rubocop
