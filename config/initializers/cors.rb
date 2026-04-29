# frozen_string_literal: true

# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.

# Read more: https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins "https://miru.so", "https://www.miru.so", /\Ahttps:\/\/.*\.miru-marketing-website\.pages\.dev\z/

    resource "/api/v1/chatbase_token",
      headers: :any,
      methods: [:get, :options],
      credentials: true
  end

  if Rails.env.local?
    allow do
      origins(/\Ahttp:\/\/(localhost|127\.0\.0\.1):\d+\z/)

      resource "/api/v1/*",
        headers: :any,
        methods: [:get, :post, :put, :patch, :delete, :options]
    end
  end
end
