# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoiceLineItemTimeEntry, type: :model do
  describe "associations" do
    it { is_expected.to belong_to(:invoice_line_item) }
    it { is_expected.to belong_to(:timesheet_entry) }
  end

  describe "validations" do
    it "does not allow the same time entry to be linked twice to one line item" do
      invoice_line_item = create(:invoice_line_item)
      time_entry = create(
        :timesheet_entry,
        user: invoice_line_item.timesheet_entry.user,
        project: invoice_line_item.timesheet_entry.project,
        bill_status: "unbilled"
      )
      create(:invoice_line_item_time_entry, invoice_line_item:, timesheet_entry: time_entry)

      duplicate_link = build(:invoice_line_item_time_entry, invoice_line_item:, timesheet_entry: time_entry)

      expect(duplicate_link).not_to be_valid
      expect(duplicate_link.errors[:timesheet_entry_id]).to include("has already been taken")
    end
  end
end
