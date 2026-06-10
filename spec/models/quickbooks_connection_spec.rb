# frozen_string_literal: true

require "rails_helper"

RSpec.describe QuickbooksConnection, type: :model do
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
