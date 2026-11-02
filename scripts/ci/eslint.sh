#!/bin/bash

set -eu

pnpm install --frozen-lockfile
pnpm exec eslint './app/javascript/**/*.{ts,tsx,js,jsx,json}'
