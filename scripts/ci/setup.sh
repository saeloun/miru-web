#!/bin/bash

set -eu

bundle install --with test

yarn install

bundle exec rake db:reset
