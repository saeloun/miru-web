# frozen_string_literal: true

require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module MiruWeb
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 7.0

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w(assets tasks))

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")

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

    config.active_model.i18n_customize_full_message = true
    config.react.camelize_props = true

    # Use a real queuing backend for Active Job (and separate queues per environment).
    config.active_job.queue_adapter = :sidekiq
  end
end
