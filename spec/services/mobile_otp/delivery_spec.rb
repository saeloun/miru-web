# frozen_string_literal: true

require "rails_helper"

RSpec.describe MobileOtp::Delivery do
  let(:company) { build(:india_company, name: "Clinic") }

  it "does not report delivery when no gateway is configured" do
    with_env(MIRU_MOBILE_OTP_SMS_URL: nil, WHATSAPP_CLOUD_API_TOKEN: nil, WHATSAPP_CLOUD_PHONE_NUMBER_ID: nil) do
      expect(described_class.deliver(phone: "+919876543210", code: "123456", company:)).to eq(false)
    end
  end

  it "posts the OTP template to WhatsApp Cloud API when configured" do
    stub = stub_request(:post, "https://graph.facebook.com/v22.0/123456789/messages")
      .with { |request|
        payload = JSON.parse(request.body)
        payload["messaging_product"] == "whatsapp" &&
          payload["to"] == "919876543210" &&
          payload["type"] == "template" &&
          payload.dig("template", "name") == "miru_login_otp" &&
          payload.dig("template", "components", 0, "parameters", 0, "text") == "123456" &&
          request.headers["Authorization"] == "Bearer whatsapp-secret"
      }
      .to_return(status: 200, body: "{}")

    with_env(
      MIRU_MOBILE_OTP_SMS_URL: nil,
      WHATSAPP_CLOUD_API_TOKEN: "whatsapp-secret",
      WHATSAPP_CLOUD_PHONE_NUMBER_ID: "123456789"
    ) do
      expect(described_class.deliver(phone: "+91 98765 43210", code: "123456", company:)).to eq(true)
    end

    expect(stub).to have_been_requested
  end

  it "falls back to a configured SMS webhook when WhatsApp is not configured" do
    stub = stub_request(:post, "https://sms.example.test/send")
      .with { |request|
        payload = JSON.parse(request.body)
        payload["code"] == "123456" &&
          payload["message"] == "123456 is your Clinic Miru login code. It expires in 10 minutes." &&
          payload["to"] == "+919876543210" &&
          request.headers["Authorization"] == "Bearer secret"
      }
      .to_return(status: 200, body: "{}")

    with_env(
      MIRU_MOBILE_OTP_SMS_AUTH_TOKEN: "secret",
      MIRU_MOBILE_OTP_SMS_URL: "https://sms.example.test/send",
      WHATSAPP_CLOUD_API_TOKEN: nil,
      WHATSAPP_CLOUD_PHONE_NUMBER_ID: nil
    ) do
      expect(described_class.deliver(phone: "+919876543210", code: "123456", company:)).to eq(true)
    end

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
