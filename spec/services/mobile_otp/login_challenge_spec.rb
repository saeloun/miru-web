# frozen_string_literal: true

require "rails_helper"

RSpec.describe MobileOtp::LoginChallenge do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id, phone: "+919876543210") }

  before do
    create(:employment, company:, user:)
    user.add_role :employee, company
  end

  it "prefers MSG91 over internal delivery when configured" do
    challenge = described_class.new(phone: user.phone)
    allow(challenge).to receive(:msg91_enabled?).and_return(true)
    allow(MobileOtp::Msg91WidgetClient).to receive(:send_otp)
      .with(identifier: "919876543210")
      .and_return(MobileOtp::Msg91WidgetClient::Response.new(req_id: "request-123"))
    allow(MobileOtp::Delivery).to receive(:deliver)

    result = challenge.request
    payload = MobileOtp::ChallengeToken.verify(result.body.fetch(:pending_token))

    expect(result.status).to eq(202)
    expect(payload).to include(
      "company_id" => company.id,
      "provider" => "msg91_widget",
      "req_id" => "request-123",
      "user_id" => user.id
    )
    expect(MobileOtp::Delivery).not_to have_received(:deliver)
  end

  it "falls back to internal delivery when MSG91 is unavailable" do
    allow(MobileOtp::Delivery).to receive(:deliver).and_return(true)

    result = described_class.request(phone: user.phone)
    payload = MobileOtp::ChallengeToken.verify(result.body.fetch(:pending_token))

    expect(result.status).to eq(202)
    expect(result.body).to include(message: "OTP sent", otp_sent: true, test_code: "123456")
    expect(payload).to include("company_id" => company.id, "user_id" => user.id)
    expect(MobileOtp::Delivery).to have_received(:deliver).with(phone: user.phone, code: "123456", company:)
  end

  it "verifies a valid challenge" do
    allow(MobileOtp::Delivery).to receive(:deliver).and_return(true)
    challenge = described_class.request(phone: user.phone)

    result = described_class.verify(
      pending_token: challenge.body.fetch(:pending_token),
      code: "123456"
    )

    expect(result).to have_attributes(user:, company:)
  end

  it "rejects an invalid challenge code" do
    allow(MobileOtp::Delivery).to receive(:deliver).and_return(true)
    challenge = described_class.request(phone: user.phone)

    expect {
      described_class.verify(
        pending_token: challenge.body.fetch(:pending_token),
        code: "000000"
      )
    }.to raise_error(MobileOtp::ChallengeToken::InvalidTokenError)
  end
end
