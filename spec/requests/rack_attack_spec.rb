# frozen_string_literal: true

require "rails_helper"

RSpec.describe "RackAttack OTP throttles", type: :request do
  let(:headers) { { "CONTENT_TYPE" => "application/json", "REMOTE_ADDR" => "203.0.113.10" } }

  around do |example|
    enabled = Rack::Attack.enabled
    store = Rack::Attack.cache.store
    Rack::Attack.enabled = true
    Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new

    example.run
  ensure
    Rack::Attack.enabled = enabled
    Rack::Attack.cache.store = store
  end

  before { Rack::Attack.cache.store.clear }
  after { Rack::Attack.cache.store.clear }

  shared_examples "an OTP verification throttle" do |path|
    it "throttles repeated attempts from the same IP" do
      10.times do |attempt|
        post path,
          params: { pending_token: "pending-token-#{attempt}", code: "000000" }.to_json,
          headers: headers

        expect(response).not_to have_http_status(:too_many_requests)
      end

      post path,
        params: { pending_token: "another-pending-token", code: "000000" }.to_json,
        headers: headers

      expect(response).to have_http_status(:too_many_requests)
      expect(response.parsed_body["error"]).to eq("Too many requests. Please try again later.")
    end
  end

  include_examples "an OTP verification throttle", "/api/v1/users/totp/authenticate"
  include_examples "an OTP verification throttle", "/api/v1/users/otp/verify"

  it "throttles report PDF generation" do
    5.times do
      get "/api/v1/reports/payments/download.pdf", headers: headers
      expect(response).not_to have_http_status(:too_many_requests)
    end

    get "/api/v1/reports/payments/download.pdf", headers: headers

    expect(response).to have_http_status(:too_many_requests)
  end
end
