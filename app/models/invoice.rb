# == Schema Information
#
# Table name: invoices
#
#  id                     :bigint           not null, primary key
#  amount                 :decimal(20, 2)   default(0.0)
#  amount_due             :decimal(20, 2)   default(0.0)
#  amount_paid            :decimal(20, 2)   default(0.0)
#  base_currency_amount   :decimal(20, 2)   default(0.0)
#  client_payment_sent_at :datetime
#  currency               :string           default("USD"), not null
#  discarded_at           :datetime
#  discount               :decimal(20, 2)   default(0.0)
#  due_date               :date
#  external_view_key      :string
#  invoice_number         :string
#  issue_date             :date
#  outstanding_amount     :decimal(20, 2)   default(0.0)
#  payment_infos          :jsonb
#  payment_sent_at        :datetime
#  reference              :text
#  sent_at                :datetime
#  status                 :integer          default("draft"), not null
#  stripe_enabled         :boolean          default(TRUE)
#  tax                    :decimal(20, 2)   default(0.0)
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  client_id              :bigint           not null
#  company_id             :bigint
#
# Indexes
#
#  index_invoices_on_client_id                      (client_id)
#  index_invoices_on_company_id                     (company_id)
#  index_invoices_on_discarded_at                   (discarded_at)
#  index_invoices_on_due_date                       (due_date)
#  index_invoices_on_external_view_key              (external_view_key) UNIQUE
#  index_invoices_on_invoice_number_and_company_id  (invoice_number,company_id) UNIQUE
#  index_invoices_on_issue_date                     (issue_date)
#  index_invoices_on_status                         (status)
#
# Foreign Keys
#
#  fk_rails_...  (client_id => clients.id)
#  fk_rails_...  (company_id => companies.id)
#

# frozen_string_literal: true

class Invoice < ApplicationRecord
  include Discard::Model
  include InvoiceSendable
  include ClientPaymentSendable

  attr_accessor :sub_total

  enum :status, { draft: 0, sent: 1, viewed: 2, paid: 3, declined: 4, overdue: 5, sending: 6, waived: 7 }

  belongs_to :company
  belongs_to :client
  has_many :invoice_line_items, dependent: :destroy
  has_many :payments, dependent: :destroy
  accepts_nested_attributes_for :invoice_line_items, allow_destroy: true

  # Payment info details
  store_accessor :payment_infos, :stripe_payment_intent

  before_validation :set_external_view_key, on: :create
  before_validation :calculate_base_currency_amount, if: :should_recalculate_base_currency?
  after_commit :refresh_invoice_index
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

  searchkick filterable: [:issue_date, :created_at, :updated_at, :client_name, :status, :invoice_number ],
    word_middle: [:invoice_number, :client_name]

  ARCHIVED_PREFIX = "ARC"

  def search_data
    {
      id: id.to_i,
      issue_date:,
      due_date:,
      invoice_number:,
      client_id:,
      status:,
      company_id:,
      client_name:,
      created_at:,
      updated_at:,
      discarded_at:
    }
  end

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
    pdf_service = PdfGeneration::InvoiceService.new(self, company_logo, root_url)
    pdf_service.process
  end

  def temp_pdf(company_logo, root_url)
    file = Tempfile.new(["invoice", ".pdf"], encoding: "ascii-8bit")
    pdf_service = PdfGeneration::InvoiceService.new(self, company_logo, root_url)
    pdf_content = pdf_service.process
    file.write(pdf_content)
    file.rewind
    file
  end

  def formatted_due_date
    CompanyDateFormattingService.new(due_date, company:).process
  end

  def formatted_issue_date
    CompanyDateFormattingService.new(issue_date, company:).process
  end

  def refresh_invoice_index
    Invoice.search_index.refresh if Invoice.search_index.exists?
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
      TimesheetEntry.where(id: timesheet_entry_ids).update!(locked: true)
    end

    def unlock_timesheet_entries
      timesheet_entry_ids = invoice_line_items.pluck(:timesheet_entry_id)
      TimesheetEntry.where(id: timesheet_entry_ids).update!(locked: false)
    end

    def same_currency?
      if currency.present?
        currency == company&.base_currency
      else
        client&.currency == company&.base_currency
      end
    end

    def update_invoice_number
      self.update(invoice_number: "#{ARCHIVED_PREFIX}-#{id}-#{invoice_number}")
    end

    def should_recalculate_base_currency?
      # Recalculate if this is a new record
      return true if new_record?

      # Recalculate if amount or currency has changed
      amount_changed? || currency_changed?
    end

    def calculate_base_currency_amount
      return if amount.nil? || currency.blank? || company.blank?

      if same_currency?
        self.base_currency_amount = amount
        return
      end

      service = CurrencyConversionService.new(
        amount:,
        from_currency: currency,
        to_currency: company.base_currency
      )

      result = service.process

      # Set the converted amount
      # If no rate is available, the service returns the original amount as fallback
      # This allows invoice creation to proceed even without API access
      self.base_currency_amount = result

      # Log warning if conversion might have failed (same amount returned for different currencies)
      if result == amount && !same_currency?
        Rails.logger.warn(
          "Currency conversion may have failed for invoice. " \
          "Using original amount as fallback. " \
          "Currency: #{currency} -> #{company.base_currency}, Amount: #{amount}"
        )
      end
    end
end
