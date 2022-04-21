# frozen_string_literal: true

WISE_API_KEY = ENV["WISE_API_KEY"]
WISE_API_URL = Rails.env.production? ? "https://api.transferwise.com" : "https://api.sandbox.transferwise.tech"
WISE_PROFILE_ID = Rails.env.production? ? "" : "16356036"
