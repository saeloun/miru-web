# frozen_string_literal: true

if defined? Rack::Cors
  Rails.configuration.middleware.insert_before 0, Rack::Cors do
    allow do
      origins %W[
        #{ENV["APP_BASE_URL"]}
        #{ENV["CLOUDFLARE_R2_ENDPOINT"]}
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
