# frozen_string_literal: true

require "rails_helper"

RSpec.describe MobileOtp::ChallengeToken do
  it "verifies a signed payload and matching code" do
    token = described_class.issue({ "user_id" => 1 }, code: "123456")
    payload = described_class.verify(token)

    expect(payload["user_id"]).to eq(1)
    expect(described_class.valid_code?(payload, "123456")).to eq(true)
    expect(described_class.valid_code?(payload, "000000")).to eq(false)
  end

  it "rejects tampered tokens" do
    token = described_class.issue({ "user_id" => 1 }, code: "123456")

    expect {
      described_class.verify("#{token}tampered")
    }.to raise_error(MobileOtp::ChallengeToken::InvalidTokenError)
  end

  it "rejects expired tokens" do
    travel_to(11.minutes.ago) do
      @token = described_class.issue({ "user_id" => 1 }, code: "123456")
    end

    expect {
      described_class.verify(@token)
    }.to raise_error(MobileOtp::ChallengeToken::InvalidTokenError)
  end
end
