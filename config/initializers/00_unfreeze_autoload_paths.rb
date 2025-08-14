# frozen_string_literal: true

# Fix for FrozenError with parallel tests in Rails 8.0.2 + Ruby 3.4.5
# Rails freezes autoload paths after initialization, but parallel tests
# need to modify them. This unfreezes them for test environment only.

if ENV["RAILS_ENV"] == "test" && ENV["TEST_ENV_NUMBER"]
  # Unfreeze autoload paths for parallel tests
  Rails.application.config.before_initialize do
    # Ensure paths are not frozen
    if Rails.application.config.respond_to?(:autoload_paths)
      paths = Rails.application.config.autoload_paths
      paths = paths.dup if paths.frozen?
      Rails.application.config.autoload_paths = paths
    end

    if Rails.application.config.respond_to?(:eager_load_paths)
      paths = Rails.application.config.eager_load_paths
      paths = paths.dup if paths.frozen?
      Rails.application.config.eager_load_paths = paths
    end
  end
end
