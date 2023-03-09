#!/bin/bash

set -eu

bundle install --without development production test

yarn install

bundle exec rake db:reset
