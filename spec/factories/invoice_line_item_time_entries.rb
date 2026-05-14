# frozen_string_literal: true

FactoryBot.define do
  factory :invoice_line_item_time_entry do
    invoice_line_item
    timesheet_entry do
      source_entry = invoice_line_item.timesheet_entry

      if source_entry.present?
        create(:timesheet_entry,
          user: source_entry.user,
          project: source_entry.project,
          bill_status: "unbilled")
      else
        project = create(:project, client: invoice_line_item.invoice.client, billable: true)
        user = create(:user, current_workspace: invoice_line_item.invoice.company)

        create(:timesheet_entry,
          user:,
          project:,
          bill_status: "unbilled")
      end
    end
  end
end
