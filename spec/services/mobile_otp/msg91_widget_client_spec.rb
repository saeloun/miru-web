# frozen_string_literal: true

require "rails_helper"

RSpec.describe MobileOtp::Msg91WidgetClient do
  around do |example|
    with_env(
      MSG91_AUTH_KEY: "msg91-secret",
      MSG91_TOKEN_AUTH: "token-secret",
      MSG91_WIDGET_ID: "widget-123"
    ) { example.run }
  end

  it "sends OTP through the MSG91 widget API" do
    stub = stub_request(:post, "https://api.msg91.com/api/v5/widget/sendOtp")
      .with { |request|
        payload = JSON.parse(request.body)
        request.headers["Authkey"].blank? &&
          payload == {
            "widgetId" => "widget-123",
            "identifier" => "919876543210",
            "tokenAuth" => "token-secret"
          }
      }
      .to_return(status: 200, body: { type: "success", message: "request-123" }.to_json)

    response = described_class.send_otp(identifier: "919876543210")

    expect(response.req_id).to eq("request-123")
    expect(stub).to have_been_requested
  end

  it "verifies OTP and returns the access token" do
    stub = stub_request(:post, "https://api.msg91.com/api/v5/widget/verifyOtp")
      .with { |request|
        payload = JSON.parse(request.body)
        request.headers["Authkey"].blank? &&
          payload == {
            "widgetId" => "widget-123",
            "reqId" => "request-123",
            "otp" => "123456",
            "tokenAuth" => "token-secret"
          }
      }
      .to_return(status: 200, body: { type: "success", "access-token": "jwt-token" }.to_json)

    response = described_class.verify_otp(req_id: "request-123", otp: "123456")

    expect(response.access_token).to eq("jwt-token")
    expect(stub).to have_been_requested
  end

  it "verifies access tokens" do
    stub = stub_request(:post, "https://api.msg91.com/api/v5/widget/verifyAccessToken")
      .with { |request|
        payload = JSON.parse(request.body)
        request.headers["Authkey"] == "msg91-secret" &&
          payload == { "access-token" => "jwt-token" }
      }
      .to_return(status: 200, body: { type: "success", message: "919876543210" }.to_json)

    response = described_class.verify_access_token(access_token: "jwt-token")

    expect(response.identifier).to eq("919876543210")
    expect(stub).to have_been_requested
  end

  def with_env(values)
    originals = values.to_h { |key, _value| [key.to_s, ENV.fetch(key.to_s, nil)] }
    values.each do |key, value|
      value.nil? ? ENV.delete(key.to_s) : ENV[key.to_s] = value
    end

    yield
  ensure
    originals.each do |key, value|
      value.nil? ? ENV.delete(key) : ENV[key] = value
    end
  end
end
