#!/bin/bash

set -eu

bin/yarn install && npx eslint './app/javascript/**/*.{ts,tsx,js,jsx,json}'
