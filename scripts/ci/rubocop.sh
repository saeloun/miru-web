#!/bin/bash

set -eu

bundle install --with test
bundle exec rubocop
