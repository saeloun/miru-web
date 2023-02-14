#!/bin/bash

set -eu

export RAILS_ENV=test
export BUILDKITE_ANALYTICS_TOKEN=dtnAJbMh9fgGZFBLqFvPxnJ9
export WISE_API_URL=https://api.sandbox.transferwise.tech
export WISE_ACCESS_TOKEN=access-token-12345
export WISE_PROFILE_ID = 123456
export EMAIL_DELIVERY_METHOD = letter_opener
export MAILER_SENDER = info@miru.saeloun.com
export REPLY_TO_EMAIL = no-reply@getmiru.com
export STRIPE_PUBLISHABLE_KEY= stripe_publishable_key
export STRIPE_SECRET_KEY = stripe_secret_key
export STRIPE_WEBHOOK_ENDPOINT_SECRET = stripe_webhook_endpoint_secret
export SENDGRID_USERNAME = apikey
export SENDGRID_PASSWORD = pass
export SMTP_DOMAIN = saeloun.com
export SMTP_PORT = 587

bundle install --with test
bin/yarn install
rake db:create
rake db:migrate
bundle exec rspec --color spec
