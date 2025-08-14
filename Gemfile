# frozen_string_literal: true

source "https://rubygems.org"
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

ruby "3.4.5"

# Bundle edge Rails instead: gem "rails", github: "rails/rails", branch: "main"
gem "rails", "~> 8.0.2.1"

# Use postgresql as the database for Active Record
gem "pg"

# Use the Puma web server [https://github.com/puma/puma]
gem "puma", "~> 6.6"

# Reduces boot times through caching
gem "bootsnap", ">= 1.18.0", require: false


# Build JSON APIs with ease [https://github.com/rails/jbuilder]
gem "jbuilder", "~> 2.11"

# Use devise for authentication
gem "devise"


# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem "tzinfo-data", platforms: %i[windows jruby]

# Add ostruct for Ruby 3.5 compatibility with shoulda-callback-matchers
gem "ostruct"

# Rails 8 solid adapters for improved performance
gem "solid_cache"
gem "solid_cable"


# Use Active Storage variants [https://guides.rubyonrails.org/active_storage_overview.html#transforming-images]
gem "image_processing", ">= 1.2"

# Modern frontend bundling with Vite
gem "vite_rails", "~> 3.0"

# Propshaft for asset pipeline (lighter than Sprockets)
gem "propshaft"

# Deployment with Kamal
gem "kamal", require: false

# Lightweight alternative to countries gem
gem "iso_country_codes"

# #--- gems for server & infra configuration ---##
gem "dotenv-rails"
gem "foreman"

# Memory allocator is handled by Docker/system level

# Add Ahoy for event tracking
gem "ahoy_matey"

# Security scanning
gem "brakeman", require: false

# currency list and conversion
gem "money"

# aws storage account
gem "aws-sdk-s3", require: false

# Search gems
gem "ransack", "~> 4.1"
gem "pg_search", "~> 2.3"

# For Soft deletion
gem "discard", "~> 1.2"


# Role management library with resource scoping
gem "rolify", "~> 6.0"

# OAuth Gems
gem "omniauth-google-oauth2", "~> 1.0"
gem "omniauth-rails_csrf_protection", "~> 1.0"

# Pundit gem for user authorization
gem "pundit", "~> 2.2"

# Auditing for tracking changes
gem "audited", "~> 5.0"

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
gem "solid_queue", "~> 0.6"

# Database search and optimization (Ankane's gems)
gem "pghero"           # PostgreSQL performance dashboard
gem "dexter"           # Automatic index suggestions

# PDF generator
gem "grover"

gem "activerecord-import"

# For finding the vulnerabilities in the gems
gem "bundler-audit", require: false
gem "ruby_audit", require: false

# For reporting messages, exceptions, and tracing events.
gem "sentry-rails"
gem "sentry-ruby", "~> 5.17"

gem "rubyzip"

gem "httparty"

# Country information and timezones
gem "countries", "~> 6.0"

# Use google calendar for integration with Miru
gem "google-api-client", require: "google/apis/calendar_v3"

group :development, :test, :ci do
  # See https://edgeguides.rubyonrails.org/debugging_rails_applications.html#debugging-with-the-debug-gem
  gem "debug", ">= 1.0.0", platforms: %i[mri windows]

  # Add Rubocop to lint and format Ruby code
  gem "rubocop", require: false
  gem "rubocop-performance", require: false
  gem "rubocop-rails", require: false
  gem "rubocop-rspec", require: false
  gem "rubocop-capybara", require: false
  gem "rubocop-factory_bot", require: false
  gem "rubocop-thread_safety", require: false

  # Use RSpec as the testing framework
  gem "rspec-rails", "~> 7.0"

  # For JUnit test output for CI
  gem "rspec_junit_formatter"

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


  # Use AnnotateRb instead of annotate for Rails 8 compatibility
  gem "annotaterb"

  gem "letter_opener"
end

group :test, :ci do
  gem "capybara", ">= 3.26"
  gem "capybara-playwright-driver"

  # Use Codecov for code coverage analysis
  gem "simplecov", require: false

  # Strategies for cleaning databases in Ruby.
  gem "database_cleaner", "~> 2.0"
  gem "hash_dot"

  gem "rspec-buildkite"
  gem "rspec-retry"

  # Enhanced RSpec reporting and formatting
  gem "fuubar", "~> 2.5"  # Progress bar for RSpec
  gem "rspec-instafail", "~> 1.0"  # Show failures immediately
  gem "super_diff", "~> 0.10"  # Better diff output
  gem "test-prof", "~> 1.3"  # Performance profiling for tests
end

# https://github.com/grosser/parallel_tests
gem "parallel_tests", group: [:development, :test]

# CORS: https://github.com/cyu/rack-cors
gem "rack-cors", "2.0.0"

# Administrate dashboard
gem "administrate"

# YAML parser
gem "psych", "~> 4"

# Email delivery service
gem "postmark-rails"

# https://github.com/ankane/strong_migrations
gem "strong_migrations"

gem "redis", "~> 5.4"
