#!/bin/bash

set -euo pipefail

rake db:reset

bundle exec rake rspec
