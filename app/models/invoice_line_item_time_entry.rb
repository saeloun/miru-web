# frozen_string_literal: true

class InvoiceLineItemTimeEntry < ApplicationRecord
  belongs_to :invoice_line_item
  belongs_to :timesheet_entry

  validates :timesheet_entry_id, uniqueness: { scope: :invoice_line_item_id }
  validate :timesheet_entry_belongs_to_invoice_company

  private

    def timesheet_entry_belongs_to_invoice_company
      return if invoice_line_item&.invoice.blank? || timesheet_entry.blank?
      return if timesheet_entry.company&.id == invoice_line_item.invoice.company_id

      errors.add(:timesheet_entry, "must belong to the same company")
    end
end
