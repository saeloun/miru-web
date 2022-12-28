#!/bin/bash

set -eu

yarn && npx eslint './app/javascript/**/*.{ts,tsx,js,jsx,json}'