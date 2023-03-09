#!/bin/bash

set -eu

bundle install --without development production test
bundle exec rubocop
