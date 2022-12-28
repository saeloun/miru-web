#!/bin/bash

set -eu

bundle exec rake assets:precompile

bundle exec rspec
