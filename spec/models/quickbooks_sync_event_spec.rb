# frozen_string_literal: true

require "rails_helper"

RSpec.describe QuickbooksSyncEvent, type: :model do
  describe "validations" do
    it "requires a payload digest" do
      event = build(:quickbooks_sync_event, payload_digest: nil)

      expect(event).not_to be_valid
      expect(event.errors[:payload_digest]).to include("can't be blank")
    end
  end

  describe "tenant consistency" do
    it "requires the QuickBooks connection to belong to the same company" do
      company = create(:company)
      other_company = create(:company)
      event = build(
        :quickbooks_sync_event,
        company:,
        quickbooks_connection: create(:quickbooks_connection, company: other_company)
      )

      expect(event).not_to be_valid
      expect(event.errors[:quickbooks_connection]).to include("must belong to the same company")
    end

    it "requires the sync run to belong to the same company" do
      company = create(:company)
      other_company = create(:company)
      event = build(
        :quickbooks_sync_event,
        company:,
        quickbooks_connection: create(:quickbooks_connection, company:),
        quickbooks_sync_run: create(:quickbooks_sync_run, company: other_company)
      )

      expect(event).not_to be_valid
      expect(event.errors[:quickbooks_sync_run]).to include("must belong to the same company")
    end

    it "requires the sync run to use the same QuickBooks connection" do
      company = create(:company)
      connection = create(:quickbooks_connection, company:)
      other_connection = create(
        :quickbooks_connection,
        company:,
        status: :disconnected,
        disconnected_at: 1.day.ago
      )
      event = build(
        :quickbooks_sync_event,
        company:,
        quickbooks_connection: connection,
        quickbooks_sync_run: create(:quickbooks_sync_run, company:, quickbooks_connection: other_connection)
      )

      expect(event).not_to be_valid
      expect(event.errors[:quickbooks_sync_run]).to include("must belong to the same QuickBooks connection")
    end
  end
end
