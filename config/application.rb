# frozen_string_literal: true

require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module AHalfInfiniteC # A Collection
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 7.0

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")
    #
    config.generators do |g|
      g.test_framework :rspec, fixture: false
    end

    config.react.server_renderer_extensions = ["jsx", "js", "tsx", "ts"]

    config.action_view.field_error_proc = Proc.new { |html_tag, instance|
      "#{html_tag}".html_safe
    }

    if (email_delivery_method = ENV["EMAIL_DELIVERY_METHOD"])
      config.action_mailer.delivery_method = email_delivery_method.to_sym
    end

    config.autoload_paths << Rails.root.join("lib")

    config.react.camelize_props = true

    # Use a real queuing backend for Active Job (and separate queues per environment).
    config.active_job.queue_adapter = :sidekiq
  end
end
