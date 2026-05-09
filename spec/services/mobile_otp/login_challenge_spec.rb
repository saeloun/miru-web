# frozen_string_literal: true

require "rails_helper"

RSpec.describe MobileOtp::LoginChallenge do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id, phone: "+919876543210") }
  let(:payload) do
    {
      "company_id" => company.id,
      "identifier" => "919876543210",
      "phone" => "+919876543210",
      "provider" => "msg91_widget",
      "req_id" => "request-123",
      "user_id" => user.id
    }
  end

  before do
    create(:employment, company:, user:)
  end

  it "fails MSG91 auth-key verification when the response has no access token" do
    allow(MobileOtp::Msg91WidgetClient).to receive(:verify_otp)
      .and_return(MobileOtp::Msg91WidgetClient::Response.new(access_token: nil))
    allow(MobileOtp::Msg91WidgetClient).to receive(:token_auth).and_return(nil)

    expect {
      described_class.new.verify(payload:, code: "123456")
    }.to raise_error(MobileOtp::ChallengeToken::InvalidTokenError)
  end

  it "treats missing token records as invalid OTP tokens" do
    allow(MobileOtp::Msg91WidgetClient).to receive(:verify_otp)
      .and_return(MobileOtp::Msg91WidgetClient::Response.new(access_token: nil))
    allow(MobileOtp::Msg91WidgetClient).to receive(:token_auth).and_return("token-secret")

    payload["user_id"] = user.id + 10_000

    expect {
      described_class.new.verify(payload:, code: "123456")
    }.to raise_error(MobileOtp::ChallengeToken::InvalidTokenError)
  end

  it "does not log raw phone numbers when MSG91 request fails" do
    allow(Rails.env).to receive(:test?).and_return(false)
    allow(MobileOtp::Msg91WidgetClient).to receive(:configured?).and_return(true)
    allow(MobileOtp::Msg91WidgetClient).to receive(:send_otp)
      .and_raise(MobileOtp::Msg91WidgetClient::Error, "network failed")
    expect(Rails.logger).to receive(:warn).with("MSG91 OTP request failed: network failed")

    result = described_class.new(phone: "+91 98765 43210", company_id: company.id).request

    expect(result.status).to eq(422)
  end
end
