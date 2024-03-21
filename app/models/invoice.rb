# == Schema Information
#
# Table name: invoices
#
#  id                     :bigint           not null, primary key
#  amount                 :decimal(20, 2)   default(0.0)
#  amount_due             :decimal(20, 2)   default(0.0)
#  amount_paid            :decimal(20, 2)   default(0.0)
#  client_payment_sent_at :datetime
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

  enum status: [
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
  after_commit :refresh_invoice_index

  validates :issue_date, :due_date, :invoice_number, presence: true
  validates :due_date, comparison: { greater_than_or_equal_to: :issue_date }, if: :not_waived
  validates :amount, :outstanding_amount, :tax,
    :amount_paid, :amount_due, :discount, numericality: { greater_than_or_equal_to: 0 }
  validates :invoice_number, uniqueness: { scope: :company_id }
  validates :reference, length: { maximum: 12 }, allow_blank: true
  validate :check_if_invoice_paid, on: :update
  validate :prevent_waived_change, on: :update

  scope :with_statuses, -> (statuses) { where(status: statuses) if statuses.present? }
  scope :issue_date_range, -> (date_range) { where(issue_date: date_range) if date_range.present? }
  scope :for_clients, -> (client_ids) { where(client_id: client_ids) if client_ids.present? }
  scope :during, -> (duration) {
    where(issue_date: duration) if duration.present?
  }

  delegate :name, to: :client, prefix: :client
  delegate :email, to: :client, prefix: :client
  delegate :logo_url, to: :client, prefix: :client

  searchkick filterable: [:issue_date, :created_at, :updated_at, :client_name, :status, :invoice_number ],
    word_middle: [:invoice_number, :client_name]

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
    TimesheetEntry.where(id: timesheet_entry_ids).update!(bill_status: :billed)
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

  def refresh_invoice_index
    Invoice.search_index.refresh
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
end
