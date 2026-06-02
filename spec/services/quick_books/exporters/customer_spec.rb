# frozen_string_literal: true

require "rails_helper"

RSpec.describe QuickBooks::Exporters::Customer do
  describe "#export!" do
    let(:company) { create(:company) }
    let(:connection) { create(:quickbooks_connection, company:, realm_id: "1234567890") }
    let(:client) { create(:client, company:, name: "Acme", email: "billing@example.com") }
    let(:qbo_client) { instance_double(QuickBooks::Client) }

    it "creates a QuickBooks customer reference and skips duplicate payloads" do
      allow(qbo_client).to receive(:post).and_return(
        "Customer" => {
          "Id" => "321",
          "SyncToken" => "0"
        }
      )

      first_reference = described_class.new(connection:, qbo_client:).export!(client)
      second_reference = described_class.new(connection:, qbo_client:).export!(client.reload)

      expect(qbo_client).to have_received(:post).once.with(
        "/v3/company/1234567890/customer",
        hash_including("DisplayName" => "Acme"),
        {}
      )
      expect(first_reference).to eq(second_reference)
      expect(first_reference).to be_synced
      expect(first_reference).to have_attributes(
        quickbooks_connection: connection,
        quickbooks_entity_type: "Customer",
        quickbooks_entity_id: "321",
        quickbooks_sync_token: "0",
        direction: "miru_to_quickbooks",
        last_error: nil
      )
      expect(QuickbooksSyncRun.where(quickbooks_connection: connection, status: :succeeded).count).to eq(2)
      expect(QuickbooksSyncEvent.where(quickbooks_connection: connection, status: :processed).count).to eq(1)
      expect(connection.reload.last_successful_sync_at).to be_present
    end

    it "updates the existing QuickBooks customer when the Miru payload changes" do
      create(:quickbooks_reference,
        company:,
        quickbooks_connection: connection,
        miru_record: client,
        quickbooks_entity_type: "Customer",
        quickbooks_entity_id: "321",
        quickbooks_sync_token: "0",
        payload_digest: "old-digest")
      allow(qbo_client).to receive(:post).and_return(
        "Customer" => {
          "Id" => "321",
          "SyncToken" => "1"
        }
      )

      reference = described_class.new(connection:, qbo_client:).export!(client)

      expect(qbo_client).to have_received(:post).with(
        "/v3/company/1234567890/customer",
        hash_including(
          "Id" => "321",
          "SyncToken" => "0",
          "sparse" => true,
          "DisplayName" => "Acme"
        ),
        { operation: "update" }
      )
      expect(reference.reload.quickbooks_sync_token).to eq("1")
      expect(reference.payload_digest).not_to eq("old-digest")
    end
  end
end
