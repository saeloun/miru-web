# frozen_string_literal: true

if defined? Rack::Cors
  Rails.configuration.middleware.insert_before 0, Rack::Cors do
    allow do
      origins %W[
        #{ENV["APP_BASE_URL"]}
        #{ENV["CLOUDFRONT_ASSET_HOST"]}
        https://miru-staging.fly.dev
        https://miru-production.fly.dev
        https://staging.miru.so
        https://app.miru.so
        localhost:3000
      ]
      resource "/assets/*"
      resource "/packs/*"
    end
  end
end
# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.

# Read more: https://github.com/cyu/rack-cors

# Rails.application.config.middleware.insert_before 0, Rack::Cors do
#   allow do
#     origins "example.com"
#
#     resource "*",
#       headers: :any,
#       methods: [:get, :post, :put, :patch, :delete, :options, :head]
#   end
# end
