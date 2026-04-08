# frozen_string_literal: true

class Invoice < ApplicationRecord
  include Discardable
  include InvoiceSendable
  include ClientPaymentSendable
  include Searchable

  # Audit currency conversions and amount changes
  audited only: [:amount, :base_currency_amount, :exchange_rate, :exchange_rate_date, :currency, :status, :amount_paid, :amount_due]

  # Configure pg_search - use ILIKE for more precise matching
  scope :pg_search, ->(query) {
    return all if query.blank?

    joins(:client).where(
      "invoices.invoice_number ILIKE :query OR invoices.reference ILIKE :query OR clients.name ILIKE :query",
      query: "%#{sanitize_sql_like(query)}%"
    )
  }

  attr_accessor :sub_total

  enum :status, [
    :draft,
    :sent,
    :viewed,
    :paid,
    :declined,
    :overdue,
    :sending,
    :waived
  ]

  belongs_to :company
  belongs_to :client
  has_many :invoice_line_items, dependent: :destroy
  has_many :payments, dependent: :destroy
  accepts_nested_attributes_for :invoice_line_items, allow_destroy: true

  # Payment info details
  store_accessor :payment_infos, :stripe_payment_intent

  before_validation :set_external_view_key, on: :create
  before_validation :calculate_amounts, if: :totals_recalculation_needed?
  before_validation :calculate_base_currency_amount
  after_save :lock_timesheet_entries, if: :draft?
  after_discard :unlock_timesheet_entries, if: :draft?
  after_discard :update_invoice_number

  validates :issue_date, :due_date, :invoice_number, presence: true
  validates :due_date, comparison: { greater_than_or_equal_to: :issue_date }, if: :not_waived
  validates :amount, :outstanding_amount, :tax,
    :amount_paid, :amount_due, :discount, numericality: { greater_than_or_equal_to: 0 }
  validates :invoice_number, uniqueness: { scope: :company_id }
  validates :reference, length: { maximum: 12 }, allow_blank: true
  validate :check_if_invoice_paid, on: :update
  validate :prevent_waived_change, on: :update
  validates :base_currency_amount, presence: true, unless: :same_currency?

  scope :with_statuses, -> (statuses) { where(status: statuses) if statuses.present? }
  scope :issue_date_range, -> (date_range) { where(issue_date: date_range) if date_range.present? }
  scope :for_clients, -> (client_ids) { where(client_id: client_ids) if client_ids.present? }
  scope :during, -> (duration) {
    where(issue_date: duration) if duration.present?
  }
  scope :active, -> { where(discarded_at: nil) }

  delegate :name, to: :client, prefix: :client
  delegate :email, to: :client, prefix: :client
  delegate :logo_url, to: :client, prefix: :client

  ARCHIVED_PREFIX = "ARC"


  def recently_sent_mail?
    sent_at.nil? || (sent_at && !(sent_at > 1.minute.ago))
  end

  def update_timesheet_entry_status!
    timesheet_entry_ids = invoice_line_items.pluck(:timesheet_entry_id)
    TimesheetEntry.kept.where(id: timesheet_entry_ids).update!(bill_status: :billed)
  end

  def create_checkout_session!(success_url:, cancel_url:)
    InvoicePayment::Checkout.process(invoice: self, success_url:, cancel_url:, metadata: { invoice_id: self.id })
  end

  def unit_amount(base_currency)
    (amount * Money::Currency.new(base_currency).subunit_to_unit).to_i
  end

  def settle!(payment)
    self.amount_paid += payment.amount

    if payment.settles?(self)
      self.status = :paid
      self.amount_due = 0
    else
      self.amount_due = amount_due - payment.amount
    end

    self.save!
  end

  def pdf_content(company_logo, root_url)
    InvoicePayment::PdfGeneration.process(
      self,
      company_logo,
      root_url
    )
  end

  def temp_pdf(company_logo, root_url)
    file = Tempfile.new()
    InvoicePayment::PdfGeneration.process(
      self,
      company_logo,
      root_url,
      file.path
    )
    file
  end

  def formatted_due_date
    CompanyDateFormattingService.new(due_date, company:).process
  end

  def formatted_issue_date
    CompanyDateFormattingService.new(issue_date, company:).process
  end


  private

    def set_external_view_key
      self.external_view_key = SecureRandom.hex
    end

    def check_if_invoice_paid
      if status_changed? && status_was == "paid"
        errors.add(:status, t("errors.can't change status"))
      end
    end

    def not_waived
      !(status.to_sym == :waived)
    end

    def prevent_waived_change
      if status_changed? && status.to_sym == :waived && ![:sent, :overdue, :viewed].include?(status_was.to_sym)
        errors.add(:status, t("errors.prevent_draft_to_waived"))
      end
    end

    def lock_timesheet_entries
      timesheet_entry_ids = invoice_line_items.pluck(:timesheet_entry_id)
      TimesheetEntry.in_workspace(company).where(id: timesheet_entry_ids).update!(locked: true)
    end

    def unlock_timesheet_entries
      timesheet_entry_ids = invoice_line_items.pluck(:timesheet_entry_id)
      TimesheetEntry.in_workspace(company).where(id: timesheet_entry_ids).update!(locked: false)
    end

    def same_currency?
      if currency.present?
        currency == company&.base_currency
      else
        client&.currency == company&.base_currency
      end
    end

    def calculate_amounts
      kept_line_items = invoice_line_items.reject(&:marked_for_destruction?)
      return reset_amounts_if_all_line_items_removed unless kept_line_items.any?

      subtotal = kept_line_items.sum { |item| (item.quantity.to_f / 60) * item.rate.to_f }.round(2)
      total = (subtotal - discount.to_f + tax.to_f).round(2)

      self.amount = total
      update_open_amounts(total)
    end

    def reset_amounts_if_all_line_items_removed
      return unless invoice_line_items.any?(&:marked_for_destruction?)

      self.amount = 0
      self.amount_due = 0
      self.outstanding_amount = 0
    end

    def update_open_amounts(total)
      return clear_open_amounts if paid? || waived?

      self.amount_due = [total - amount_paid.to_f, 0].max.round(2)
      self.outstanding_amount = amount_due
    end

    def clear_open_amounts
      self.amount_due = 0
      self.outstanding_amount = 0
    end

    def totals_recalculation_needed?
      new_record? ||
        will_save_change_to_discount? ||
        will_save_change_to_tax? ||
        will_save_change_to_amount_paid? ||
        will_save_change_to_status? ||
        (association(:invoice_line_items).loaded? && invoice_line_items.any?(&:changed_for_autosave?))
    end

    def update_invoice_number
      self.update(invoice_number: "#{ARCHIVED_PREFIX}-#{id}-#{invoice_number}")
    end

    def calculate_base_currency_amount
      if same_currency?
        self.base_currency_amount = amount if amount.present?
        return
      end
      return unless amount_changed? || currency_changed? || new_record?

      # Get the exchange rate for the invoice date
      invoice_date = issue_date || Date.current
      rate = CurrencyConversionService.get_exchange_rate(
        currency || client&.currency,
        company&.base_currency,
        invoice_date
      )

      if rate
        self.exchange_rate = rate
        self.exchange_rate_date = invoice_date
        self.base_currency_amount = (amount * rate).round(2)
      else
        # If we can't get a rate, make sure validation will fail
        self.base_currency_amount = nil unless base_currency_amount.present?
      end
    end
end
