# frozen_string_literal: true

require "rails_helper"
require Rails.root.join("db/migrate/20261023090100_encrypt_totp_secrets")

RSpec.describe "User authenticator secret storage", type: :model do
  let(:user) { create(:user) }

  it "encrypts authenticator secrets at rest while preserving verification" do
    user.reset_totp_setup!
    secret = user.otp_secret
    expect(user.reload).to be_encrypted_attribute(:otp_secret_ciphertext)
    expect(user.read_attribute_before_type_cast(:otp_secret_ciphertext)).not_to include(secret)
    expect(user.verify_totp_code!(ROTP::TOTP.new(secret).now)).to eq(true)
  end

  it "encrypts legacy secrets without changing existing authenticator setups" do
    secret = ROTP::Base32.random_base32
    User.connection.execute(User.sanitize_sql_array([
      "UPDATE users SET otp_secret_ciphertext = ? WHERE id = ?", secret, user.id
    ]))
    expect(user.reload.otp_secret).to eq(secret)
    expect(user).not_to be_encrypted_attribute(:otp_secret_ciphertext)

    EncryptTotpSecrets.new.up

    expect(user.reload).to be_encrypted_attribute(:otp_secret_ciphertext)
    expect(user.otp_secret).to eq(secret)
    expect(user.verify_totp_code!(ROTP::TOTP.new(secret).now)).to eq(true)
  end

  it "revokes browser trust on passkey changes without changing native API credentials" do
    api_token = user.token
    version = user.browser_trust_version
    passkey = user.passkeys.create!(external_id: SecureRandom.hex, public_key: "test-public-key", sign_count: 0)
    expect(user.reload.browser_trust_version).to eq(version + 1)
    expect(user.token).to eq(api_token)

    passkey.destroy!
    expect(user.reload.browser_trust_version).to eq(version + 2)
    expect(user.token).to eq(api_token)
  end

  it "redacts authentication fields without hiding unrelated codes" do
    filter = ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters)
    expect(filter.filter({ "code" => "123456", "recovery_code" => "ABCD-EFGH", "credential" => {},
      "country_code" => "US" })).to eq({ "code" => "[FILTERED]", "recovery_code" => "[FILTERED]",
        "credential" => "[FILTERED]", "country_code" => "US" })
  end
end
