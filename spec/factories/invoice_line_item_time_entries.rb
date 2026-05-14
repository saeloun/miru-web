# frozen_string_literal: true

FactoryBot.define do
  factory :invoice_line_item_time_entry do
    invoice_line_item
    timesheet_entry do
      create(:timesheet_entry,
        user: invoice_line_item.timesheet_entry.user,
        project: invoice_line_item.timesheet_entry.project,
        bill_status: "unbilled")
    end
  end
end
