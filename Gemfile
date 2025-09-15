# frozen_string_literal: true

source "https://rubygems.org"
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

ruby "3.2.4"

# Bundle edge Rails instead: gem "rails", github: "rails/rails", branch: "main"
gem "rails", "~> 7.1.5.1"

# Use postgresql as the database for Active Record
gem "pg"

# Use the Puma web server [https://github.com/puma/puma]
gem "puma", "~> 6.4.3"

# Use JavaScript with ESM import maps [https://github.com/rails/importmap-rails]
# gem "importmap-rails", ">= 0.9.2"

# Hotwire's SPA-like page accelerator [https://turbo.hotwired.dev]
# gem "turbo-rails", ">= 0.9.0"

# Hotwire's modest JavaScript framework [https://stimulus.hotwired.dev]
# gem "stimulus-rails", ">= 0.7.3"

# Use Tailwind CSS [https://github.com/rails/tailwindcss-rails]
# gem "tailwindcss-rails", ">= 0.5.3"

# Build JSON APIs with ease [https://github.com/rails/jbuilder]
gem "jbuilder", "~> 2.11"

# Use devise for authentication
gem "devise"

# Use Kredis to get higher-level data types in Redis [https://github.com/rails/kredis]
# gem "kredis"

# Use Active Model has_secure_password [https://guides.rubyonrails.org/active_model_basics.html#securepassword]
# gem "bcrypt", "~> 3.1.7"

# A ruby implementation of the RFC 7519 OAuth JSON Web Token (JWT) standard.
# gem "jwt"

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem "tzinfo-data", platforms: %i[mingw mswin x64_mingw jruby]

# Reduces boot times through caching; required in config/boot.rb
gem "bootsnap", ">= 1.4.4", require: false

# Use Sass to process CSS
# gem "sassc-rails", "~> 2.1"

# Use Active Storage variants [https://guides.rubyonrails.org/active_storage_overview.html#transforming-images]
gem "image_processing", ">= 1.2"

# Webpack bundler for rails
gem "shakapacker", "6.0.0"

# React hook for rails
gem "react-rails", "2.6.2"

# Use SCSS for stylesheets
gem "sass-rails"

# #--- gems for server & infra configuration ---##
gem "dotenv-rails"
gem "foreman"

# info of countries and state
gem "countries"

# Letter opener can be configured to avoid sending sending actual emails whenever required.
gem "letter_opener_web"

# currency list and conversion
gem "money"

# aws storage account
gem "aws-sdk-s3", require: false

# Ransack gem for advanced searching
gem "ransack", "~> 4.1"

# For Soft deletion
gem "discard", "~> 1.2"

# Use newrelic for monitoring
gem "newrelic_rpm", "~> 9.8.0"

# Role management library with resource scoping
gem "rolify", "~> 6.0"

# OAuth Gems
gem "omniauth-google-oauth2", "~> 1.0"
gem "omniauth-rails_csrf_protection", "~> 1.0"

# Pundit gem for user authorization
gem "pundit", "~> 2.2"

# Data migration gem to migrate data alongside schema changes
gem "data_migrate"

# pagy for Pagination
gem "pagy", "~> 5.10"

gem "nokogiri", ">= 1.18.4"

# Manage application specific business logic. https://github.com/AaronLasseigne/active_interaction
gem "active_interaction"

# For stripe payments
gem "stripe"

# Background job processing adapter and dashboard
gem "mission_control-jobs"
gem "solid_queue", "~> 0.3"

# searchkick for elasticsearch
gem "elasticsearch", "< 7.14" # select one
gem "searchkick"

# PDF generator - using Ferrum PDF for modern Chrome-based PDF generation
gem "ferrum_pdf"

gem "activerecord-import"

# For finding the vulnerabilities in the gems
gem "bundler-audit", require: false
gem "ruby_audit", require: false

# For reporting messages, exceptions, and tracing events.

gem "rubyzip"

gem "ahoy_matey"

gem "httparty"

# Use google calendar for integration with Miru
gem "google-api-client", require: "google/apis/calendar_v3"

group :development, :test, :ci do
  # See https://edgeguides.rubyonrails.org/debugging_rails_applications.html#debugging-with-the-debug-gem
  gem "debug", ">= 1.0.0", platforms: %i[mri mingw x64_mingw]

  # Add Rubocop to lint and format Ruby code
  gem "rubocop", require: false
  gem "rubocop-performance", require: false
  gem "rubocop-rails", require: false
  gem "rubocop-rspec", require: false

  # Use RSpec as the testing framework
  gem "rspec-rails", "~> 7.0"

  # For linting ERB files
  gem "erb_lint", require: false, git: "https://github.com/Shopify/erb-lint.git", branch: "main"

  # Simple one-liner tests for common Rails functionality
  gem "shoulda-callback-matchers", "~> 1.1.1"
  gem "shoulda-matchers", "~> 5.1"

  # Use factory-bot to replace fixtures
  gem "factory_bot_rails"

  # Use Faker for fake data
  gem "faker"

  # Added rails controller to use render_template
  gem "rails-controller-testing", "~> 1.0", ">= 1.0.5"

  # help to kill N+1 queries and unused eager loading. https://github.com/flyerhzm/bullet
  gem "bullet", "~> 7.1"

  # To record response of outgoing API calls
  gem "vcr", "~> 6.1"
  gem "webmock", "~> 3.14.0"

  gem "dockerfile-rails"
end

group :development do
  # Use console on exceptions pages [https://github.com/rails/web-console]
  gem "web-console", ">= 4.1.0"

  # Add speed badges [https://github.com/MiniProfiler/rack-mini-profiler]
  gem "rack-mini-profiler", ">= 2.3.3"

  # Speed up commands on slow machines / big apps [https://github.com/rails/spring]
  gem "spring"

  # Annotate gem for showing schema information
  gem "annotate"

  gem "letter_opener"
end

group :test, :ci do
  gem "capybara", ">= 3.26"
  gem "selenium-webdriver", ">= 4.0.0"

  # Use Codecov for code coverage analysis
  gem "simplecov", require: false

  # Strategies for cleaning databases in Ruby.
  gem "database_cleaner", "~> 2.0"
  gem "hash_dot"

  gem "rspec-buildkite"
  gem "rspec-retry"

  # BuildKite Test Collector
  # gem "buildkite-test_collector", git: "https://github.com/buildkite/test-collector-ruby.git", branch: "main"
end

# Ref: https://www.plymouthsoftware.com/articles/rails-on-docker-system-specs-in-containers-with-rspec-capybara-chrome-and-selenium/

# https://github.com/ankane/strong_migrations
gem "strong_migrations"

# Error tracking: https://docs.sentry.io/platforms/ruby/guides/rails/
gem "sentry-rails"
gem "sentry-ruby", "~> 5.17"

# https://github.com/grosser/parallel_tests
gem "parallel_tests", group: [:development, :test]

# CORS: https://github.com/cyu/rack-cors
gem "rack-cors", "2.0.0"

# Administrate dashboard
gem "administrate"

gem "psych", "~> 4"

gem "postmark-rails"
