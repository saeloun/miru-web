# frozen_string_literal: true

require "rails_helper"

RSpec.describe QuickbooksConnection, type: :model do
  describe "provider credential encryption key" do
    let(:source_key) { "synthetic-original-provider-key-" + ("s" * 64) }
    let(:rotated_key) { "synthetic-session-key-" + ("r" * 64) }
    let(:tokens) { { "access_token" => "synthetic-access-token", "refresh_token" => "synthetic-refresh-token" } }
    let(:legacy_encryptor) do
      key = Rails.application.key_generator(source_key).generate_key("quickbooks_connection_tokens", 32)
      ActiveSupport::MessageEncryptor.new(key)
    end
    let(:connection) do
      attributes = tokens.to_h { |name, value| ["#{name}_ciphertext", legacy_encryptor.encrypt_and_sign(value)] }
      described_class.new(attributes)
    end

    before do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with("PROVIDER_CREDENTIALS_ENCRYPTION_SECRET").and_return(nil)
      allow(Rails.application).to receive(:secret_key_base).and_return(source_key)
    end

    it "keeps legacy ciphertext readable without an explicit provider key" do
      tokens.each { |name, value| expect(connection.public_send(name)).to eq(value) }
    end

    it "reads legacy ciphertext after only the session key changes when the original provider key is pinned" do
      ciphertext = connection.attributes.slice("access_token_ciphertext", "refresh_token_ciphertext")
      allow(ENV).to receive(:[]).with("PROVIDER_CREDENTIALS_ENCRYPTION_SECRET").and_return(source_key)
      allow(Rails.application).to receive(:secret_key_base).and_return(rotated_key)

      tokens.each { |name, value| expect(connection.public_send(name)).to eq(value) }
      expect(connection.attributes.slice(*ciphertext.keys)).to eq(ciphertext)
      tokens.each do |name, value|
        connection.public_send("#{name}=", value)
        expect(legacy_encryptor.decrypt_and_verify(connection.public_send("#{name}_ciphertext"))).to eq(value)
      end
    end

    it "fails closed after a session key change without a pinned provider key" do
      connection
      allow(Rails.application).to receive(:secret_key_base).and_return(rotated_key)

      tokens.each_key { |name| expect(connection.public_send(name)).to be_nil }
    end

    it "fails closed with an incorrect explicit provider key" do
      allow(ENV).to receive(:[]).with("PROVIDER_CREDENTIALS_ENCRYPTION_SECRET").and_return(rotated_key)
      expect(Rails.logger).to receive(:warn).with("QuickbooksConnection credential decryption failed").exactly(tokens.size).times

      tokens.each_key { |name| expect(connection.public_send(name)).to be_nil }
    end
  end

  describe "token encryption" do
    it "stores access and refresh tokens encrypted" do
      connection = build(:quickbooks_connection)

      expect(connection.access_token).to eq("quickbooks-access-token")
      expect(connection.refresh_token).to eq("quickbooks-refresh-token")
      expect(connection.access_token_ciphertext).not_to include("quickbooks-access-token")
      expect(connection.refresh_token_ciphertext).not_to include("quickbooks-refresh-token")
    end
  end

  describe "#disconnect!" do
    it "clears tokens and marks the connection disconnected" do
      connection = create(:quickbooks_connection)

      connection.disconnect!

      expect(connection).to be_disconnected
      expect(connection.disconnected_at).to be_present
      expect(connection.access_token).to be_nil
      expect(connection.refresh_token).to be_nil
    end
  end

  describe "#reconnect_required?" do
    it "returns true when the refresh token lifetime has expired" do
      connection = build(:quickbooks_connection, refresh_token_expires_at: 1.minute.ago)

      expect(connection).to be_reconnect_required
    end

    it "returns false while a connected refresh token is still valid" do
      connection = build(:quickbooks_connection, refresh_token_expires_at: 1.day.from_now)

      expect(connection).not_to be_reconnect_required
    end
  end
end
