# frozen_string_literal: true

class InvoiceLineItem < ApplicationRecord
  belongs_to :invoice
  belongs_to :timesheet_entry, optional: true

  before_update :capture_previous_invoice_id, if: :will_save_change_to_invoice_id?
  before_destroy :unlock_timesheet_entry
  after_commit :sync_invoice_totals, on: [:create, :update, :destroy]

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
      if invoice.draft? && timesheet_entry.present?
        timesheet_entry.update!(locked: false)
      end
    end

    def capture_previous_invoice_id
      @previous_invoice_id = invoice_id_was
    end

    def sync_invoice_totals
      return unless should_sync_invoice_totals?

      invoice_ids_to_sync.each do |current_invoice_id|
        invoice = Invoice.includes(:invoice_line_items).find_by(id: current_invoice_id)
        next unless invoice

        invoice.sync_totals_from_line_items!(invoice.invoice_line_items.to_a)
      end
    ensure
      @previous_invoice_id = nil
    end

    def should_sync_invoice_totals?
      destroyed? ||
        previous_changes.key?("id") ||
        previous_changes.key?("invoice_id") ||
        previous_changes.key?("quantity") ||
        previous_changes.key?("rate")
    end

    def invoice_ids_to_sync
      ids = [invoice_id]
      ids << @previous_invoice_id if defined?(@previous_invoice_id)
      ids << previous_changes.dig("invoice_id", 0)
      ids.compact.uniq
    end
end
