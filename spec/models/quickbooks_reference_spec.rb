# frozen_string_literal: true

require "rails_helper"

RSpec.describe QuickbooksReference, type: :model do
  describe "tenant consistency" do
    it "requires the QuickBooks connection to belong to the same company" do
      company = create(:company)
      other_company = create(:company)
      reference = build(
        :quickbooks_reference,
        company:,
        quickbooks_connection: create(:quickbooks_connection, company: other_company),
        miru_record: create(:client, company:)
      )

      expect(reference).not_to be_valid
      expect(reference.errors[:quickbooks_connection]).to include("must belong to the same company")
    end

    it "requires the Miru record to belong to the same company" do
      company = create(:company)
      other_company = create(:company)
      reference = build(
        :quickbooks_reference,
        company:,
        quickbooks_connection: create(:quickbooks_connection, company:),
        miru_record: create(:client, company: other_company)
      )

      expect(reference).not_to be_valid
      expect(reference.errors[:miru_record]).to include("must belong to the same company")
    end
  end
end
