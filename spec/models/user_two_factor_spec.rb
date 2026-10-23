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
end
