# frozen_string_literal: true

require "rails_helper"

RSpec.describe QuickbooksSyncRun, type: :model do
  describe "tenant consistency" do
    it "requires the QuickBooks connection to belong to the same company" do
      company = create(:company)
      other_company = create(:company)
      sync_run = build(
        :quickbooks_sync_run,
        company:,
        quickbooks_connection: create(:quickbooks_connection, company: other_company)
      )

      expect(sync_run).not_to be_valid
      expect(sync_run.errors[:quickbooks_connection]).to include("must belong to the same company")
    end
  end
end
