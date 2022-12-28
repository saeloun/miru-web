#!/bin/bash

set -eu

bundle install --with test

yarn install

rakes assets: precompile

bundle exec rake db:reset