# frozen_string_literal: true

class InvoiceLineItem < ApplicationRecord
  belongs_to :invoice
  belongs_to :timesheet_entry, optional: true

  before_destroy :unlock_timesheet_entry

  validates :name, :date, :rate, :quantity, presence: true
  validates :rate, numericality: { greater_than_or_equal_to: 0 }
  validates :quantity, numericality: { greater_than_or_equal_to: 0 }
  validate :timesheet_entry_belongs_to_invoice_company

  def self.total_cost_of_all_line_items
    (self.sum("quantity * rate") / 60.0).round(3)
  end

  def hours_spent
    @_hours_spent ||= quantity.to_f / 60.0
  end

  def minutes_spent
    @_minutes_spent ||= quantity.to_f % 60.0
  end

  def time_spent
    if quantity <= 0
      "00:00"
    else
      hours = hours_spent.to_i
      hours = "0#{hours}" if hours.digits.count == 1

      minutes = minutes_spent.to_i
      minutes = "0#{minutes}" if minutes.digits.count == 1

      "#{hours}:#{minutes}"
    end
  end

  def total_cost
    @_total_cost ||= (hours_spent * rate).round(3)
  end

  def formatted_date
    CompanyDateFormattingService.new(date, company: invoice.company).process
  end

  private

    def timesheet_entry_belongs_to_invoice_company
      return if timesheet_entry.blank? || invoice.blank?
      return if timesheet_entry.company&.id == invoice.company_id

      errors.add(:timesheet_entry, "must belong to the same company")
    end

    def unlock_timesheet_entry
      if invoice.draft?
        timesheet_entry.update!(locked: false)
      end
    end
end
