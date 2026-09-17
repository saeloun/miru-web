# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Rack::Attack multipart handling", type: :request do
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

  it "does not raise for empty multipart content" do
    post "/",
      headers: {
        "CONTENT_TYPE" => "multipart/form-data; boundary=----x",
        "CONTENT_LENGTH" => "64"
      },
      env: { "rack.input" => StringIO.new("") }

    expect(response.status).to be < 500
  end

  it "keeps the reports pdf throttle from parsing the request body" do
    env = Rack::MockRequest.env_for(
      "/",
      method: "POST",
      input: "",
      "CONTENT_TYPE" => "multipart/form-data; boundary=----x",
      "CONTENT_LENGTH" => "64"
    )
    request = Rack::Attack::Request.new(env)
    throttle = Rack::Attack.throttles.fetch("reports/pdf/ip")

    expect { request.params }.to raise_error(EOFError)
    expect(throttle.block.call(request)).to be_nil
  end

  it "throttles PayPal webhooks by source IP" do
    env = Rack::MockRequest.env_for(
      "/webhooks/paypal/events",
      method: "POST",
      "REMOTE_ADDR" => "203.0.113.10"
    )
    request = Rack::Attack::Request.new(env)
    throttle = Rack::Attack.throttles.fetch("webhooks/paypal/ip")

    expect(throttle.limit).to eq(120)
    expect(throttle.block.call(request)).to eq("203.0.113.10")
  end

  it "throttles PayPal invoice starts and returns by source IP" do
    throttle = Rack::Attack.throttles.fetch("invoice/checkout/ip")

    %w[
      /invoices/invoice-key/payments/new
      /invoices/invoice-key/payments/paypal_return
    ].each do |path|
      request = Rack::Attack::Request.new(
        Rack::MockRequest.env_for(path, method: "GET", "REMOTE_ADDR" => "203.0.113.10")
      )

      expect(throttle.block.call(request)).to eq("203.0.113.10")
    end
  end
end
