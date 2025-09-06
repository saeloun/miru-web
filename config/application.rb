# frozen_string_literal: true

require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module MiruWeb
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 8.0

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w[assets tasks])
    config.autoload_paths << "#{config.root}/app/services/concerns"

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

    # React configuration handled by Vite

    config.action_view.field_error_proc = Proc.new { |html_tag, instance|
      "#{html_tag}".html_safe
    }

    if (email_delivery_method = ENV["EMAIL_DELIVERY_METHOD"])
      config.action_mailer.delivery_method = email_delivery_method.to_sym
    end
    config.action_mailer.postmark_settings = { api_token: ENV["POSTMARK_API_TOKEN"] }

    config.active_model.i18n_customize_full_message = true
    # Props handling managed in React components

    # Use a real queuing backend for Active Job (and separate queues per environment).
    config.active_job.queue_adapter = :solid_queue
    config.mission_control.jobs.base_controller_class = "MissionControlController"

    # Branding
    config.x.app_name = "Miru Agency OS"
  end
end
